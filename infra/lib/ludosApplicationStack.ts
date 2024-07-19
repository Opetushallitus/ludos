import * as cdk from 'aws-cdk-lib'
import { aws_cloudwatch_actions, Duration, RemovalPolicy } from 'aws-cdk-lib'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import * as sns from 'aws-cdk-lib/aws-sns'
import { Construct } from 'constructs'
import { CommonStackProps } from '../types'
import { accounts } from './accounts'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { BucketAccessControl } from 'aws-cdk-lib/aws-s3'
import * as certificateManager from 'aws-cdk-lib/aws-certificatemanager'
import * as cf from 'aws-cdk-lib/aws-cloudfront'
import * as cfOrigins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as athena from 'aws-cdk-lib/aws-athena'
import * as glue from 'aws-cdk-lib/aws-glue'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import { AlbStack } from './albStack'
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets'
import { DbStack } from './dbStack'
import { LogGroupStack } from './logGroupStack'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { S3Stack } from './S3Stack'
import { GithubActionsStack } from './githubActionsStack'

interface LudosApplicationStackProps extends CommonStackProps {
  ludosApplicationImageTag: string
  productionGrade: boolean
  vpc: ec2.Vpc
  ecsCluster: ecs.Cluster
  securityGroup: ec2.SecurityGroup
  logGroupStack: LogGroupStack
  auditLogLogGroupStack: LogGroupStack
  albStack: AlbStack
  hostedZone: route53.HostedZone
  domain: string
  cloudFrontCertificate: certificateManager.Certificate
  dbStack: DbStack
  s3BucketStack: S3Stack
  alarmSnsTopic: sns.Topic
  githubActionsStack?: GithubActionsStack
}

export class LudosApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LudosApplicationStackProps) {
    super(scope, id, props)

    const memoryLimitMiB = 2048

    const fargateTaskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: memoryLimitMiB,
      cpu: 1024
    })

    const ludosServiceUserSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'ServiceUserSecret',
      `/${props.envNameCapitalized}LudosStack/LudosApplicationStack/OphServiceUserCredentials`
    )

    const ecrRepository = ecr.Repository.fromRepositoryArn(
      this,
      'EcrRepo',
      `arn:aws:ecr:${props.env.region}:${accounts.utility.id}:repository/ludos`
    )
    const imageTag = ecs.ContainerImage.fromEcrRepository(ecrRepository, props.ludosApplicationImageTag)
    const taskContainer = fargateTaskDefinition.addContainer('Container', {
      image: imageTag,
      memoryLimitMiB,
      logging: props.logGroupStack.logDriver,
      essential: true,
      environment: {
        SPRING_PROFILES_ACTIVE: props.envName,
        DB_URL: `jdbc:postgresql://${props.dbStack.instance.instanceEndpoint.hostname}:5432/ludos`,
        AUDIT_LOG_LOG_GROUP_NAME: props.auditLogLogGroupStack.logGroupName
      },
      secrets: {
        DB_USER: ecs.Secret.fromSecretsManager(props.dbStack.masterPasswordSecret, 'username'),
        DB_PASS: ecs.Secret.fromSecretsManager(props.dbStack.masterPasswordSecret, 'password'),
        LUDOS_PALVELUKAYTTAJA_USERNAME: ecs.Secret.fromSecretsManager(ludosServiceUserSecret, 'username'),
        LUDOS_PALVELUKAYTTAJA_PASSWORD: ecs.Secret.fromSecretsManager(ludosServiceUserSecret, 'password')
      },
      linuxParameters: new ecs.LinuxParameters(fargateTaskDefinition, `ContainerLinuxParameters`, {
        initProcessEnabled: true
      })
    })
    taskContainer.addPortMappings({ containerPort: 8080 })

    const fargateService = new ecs.FargateService(this, 'Service', {
      platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
      cluster: props.ecsCluster,
      securityGroups: [props.securityGroup],
      taskDefinition: fargateTaskDefinition,
      desiredCount: 2,
      serviceName: `${props.envNameCapitalized}Service`,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
      enableExecuteCommand: true
    })

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc: props.vpc,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [fargateService],
      healthCheck: {
        enabled: true,
        path: '/api/health-check',
        timeout: Duration.seconds(10),
        interval: Duration.seconds(35),
        unhealthyThresholdCount: 2,
        healthyThresholdCount: 3
      }
    })

    const conditions = [elbv2.ListenerCondition.hostHeaders([props.domain])]
    new elbv2.ApplicationListenerRule(this, `ListenerRule`, {
      listener: props.albStack.httpsListener,
      conditions,
      targetGroups: [targetGroup],
      priority: 10
    })

    const cert = new certificateManager.Certificate(props.albStack, 'Certificate', {
      domainName: props.domain,
      subjectAlternativeNames: [`*.${props.domain}`],
      validation: certificateManager.CertificateValidation.fromDns(props.hostedZone)
    })
    props.albStack.httpsListener.addCertificates(`HttpsListenerCertificates`, [cert])

    const cloudFrontLogBucket = new s3.Bucket(this, 'CloudFrontLogBucket', {
      bucketName: `ludos-application-cloudfront-logs-${props.envName}`,
      accessControl: BucketAccessControl.LOG_DELIVERY_WRITE,
      removalPolicy: props.productionGrade ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
    })

    const cloudFrontDistribution = new cf.Distribution(this, 'CloudFrontDistribution', {
      certificate: props.cloudFrontCertificate,
      domainNames: [props.domain],
      priceClass: cf.PriceClass.PRICE_CLASS_100,
      httpVersion: cf.HttpVersion.HTTP2_AND_3,
      enableLogging: true,
      logBucket: cloudFrontLogBucket,
      defaultBehavior: {
        // Kaikki liikenne menee CloudFrontin läpi, myös API-kutsut. Cloudfront
        // on conffattu mahdollisimman tyhmäksi, origin ohjaa toimintaa
        // Cache-Control-headerilla, joka on defaulttina "no-cache, no-store, max-age=0, must-revalidate",
        // jos muuta ei ole endpointille conffattu.
        allowedMethods: cf.AllowedMethods.ALLOW_ALL,
        origin: new cfOrigins.LoadBalancerV2Origin(props.albStack.alb, {
          protocolPolicy: cf.OriginProtocolPolicy.HTTPS_ONLY
        }),
        cachePolicy: new cf.CachePolicy(this, 'CloudFrontDefaultCachePolicy', {
          minTtl: Duration.seconds(0), // Tämän on tärkeää olla 0, jotta Cache-Control-headerilla voi disabloida kakutuksen originista
          maxTtl: Duration.days(365),
          defaultTtl: Duration.hours(24),
          headerBehavior: cf.CacheHeaderBehavior.none(),
          cookieBehavior: cf.CacheCookieBehavior.none(),
          queryStringBehavior: cf.CacheQueryStringBehavior.all(),
          enableAcceptEncodingGzip: true
        }),
        originRequestPolicy: new cf.OriginRequestPolicy(this, 'CloudFrontDefaultOriginRequestPolicy', {
          headerBehavior: cf.OriginRequestHeaderBehavior.all(),
          queryStringBehavior: cf.OriginRequestQueryStringBehavior.all(),
          cookieBehavior: cf.OriginRequestCookieBehavior.all()
        }),
        responseHeadersPolicy: new cf.ResponseHeadersPolicy(this, 'CloudFrontDefaultResponseHeaderPolicy', {
          serverTimingSamplingRate: 0.0001 // Käytä 'Pragma: server-timing' saadaksesi Server-Timing header CloudFrontilta
        }),
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      }
    })

    new route53.ARecord(this, 'CloudFrontARecord', {
      zone: props.hostedZone,
      target: {
        aliasTarget: new route53Targets.CloudFrontTarget(cloudFrontDistribution)
      },
      recordName: props.domain
    })

    const buckets = props.s3BucketStack.allBuckets()
    const s3PolicyStatement = new PolicyStatement({
      actions: ['s3:ListBucket', 's3:PutObject', 's3:GetObject', 's3:DeleteObject'],
      resources: buckets.flatMap((bucket) => [bucket.bucketArn, `${bucket.bucketArn}/*`])
    })

    fargateTaskDefinition.addToTaskRolePolicy(s3PolicyStatement)
    props.githubActionsStack?.githubActionsRole.addToPolicy(s3PolicyStatement)

    this.setupAlarms(props, targetGroup, fargateService)
    this.setupCloudFrontLogAthena(cloudFrontLogBucket, props)
  }

  private setupAlarms(
    props: LudosApplicationStackProps,
    targetGroup: elbv2.ApplicationTargetGroup,
    fargateService: ecs.FargateService
  ) {
    const alarmSnsAction = new aws_cloudwatch_actions.SnsAction(props.alarmSnsTopic)

    const unhealthyTasksAlarm = new cloudwatch.Alarm(this, 'UnhealthyTasksAlarm', {
      alarmName: 'UnhealthyTasksAlarm',
      metric: targetGroup.metrics.unhealthyHostCount({
        statistic: 'Average',
        period: cdk.Duration.seconds(30)
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    })
    unhealthyTasksAlarm.addAlarmAction(alarmSnsAction)
    unhealthyTasksAlarm.addOkAction(alarmSnsAction)

    const cpuUtilizationAlarm = new cloudwatch.Alarm(this, 'CpuUtilizationAlarm', {
      alarmName: 'CpuUtilizationAlarm',
      metric: fargateService.metricCpuUtilization({
        statistic: 'Maximum',
        period: cdk.Duration.minutes(5)
      }),
      threshold: 80,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    })
    cpuUtilizationAlarm.addAlarmAction(alarmSnsAction)
    cpuUtilizationAlarm.addOkAction(alarmSnsAction)

    const memoryUtilizationAlarm = new cloudwatch.Alarm(this, 'MemoryUtilizationAlarm', {
      alarmName: 'MemoryUtilizationAlarm',
      metric: fargateService.metricMemoryUtilization({
        statistic: 'Maximum',
        period: cdk.Duration.minutes(5)
      }),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    })
    memoryUtilizationAlarm.addAlarmAction(alarmSnsAction)
    memoryUtilizationAlarm.addOkAction(alarmSnsAction)

    const alb5xxAlarm = new cloudwatch.Alarm(this, 'Alb5xxAlarm', {
      alarmName: 'Alb5xxAlarm',
      metric: props.albStack.alb.metrics.httpCodeElb(elbv2.HttpCodeElb.ELB_5XX_COUNT, {
        statistic: 'Sum',
        period: cdk.Duration.minutes(5)
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    })
    alb5xxAlarm.addAlarmAction(alarmSnsAction)
    alb5xxAlarm.addOkAction(alarmSnsAction)

    const backupFailedAlarm = new cloudwatch.Alarm(this, 'BackupFailedAlarm', {
      alarmName: 'BackupFailedAlarm',
      metric: new cloudwatch.Metric({
        metricName: 'NumberOfBackupJobsFailed',
        namespace: 'AWS/Backup',
        statistic: 'Sum',
        period: cdk.Duration.minutes(15)
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    })
    backupFailedAlarm.addOkAction(alarmSnsAction)
    backupFailedAlarm.addAlarmAction(alarmSnsAction)
  }

  private setupCloudFrontLogAthena(cloudFrontLogBucket: s3.Bucket, props: LudosApplicationStackProps) {
    let glueDbName = 'cf_logs_db'
    const glueDatabase = new glue.CfnDatabase(this, 'CfGlueDb', {
      catalogId: this.account,
      databaseInput: {
        description: 'Glue DB for CloudFront access logs',
        name: glueDbName
      }
    })

    const glueTableName = 'cf_logs_table'
    const glueTable = new glue.CfnTable(this, 'CfGlueTable', {
      catalogId: this.account,
      databaseName: glueDbName,
      tableInput: {
        name: glueTableName,
        description: 'Glue table for CloudFront access logs',
        storageDescriptor: {
          columns: [
            { name: 'date', type: 'date' },
            { name: 'time', type: 'string' },
            { name: 'x_edge_location', type: 'string' },
            { name: 'sc_bytes', type: 'bigint' },
            { name: 'c_ip', type: 'string' },
            { name: 'cs_method', type: 'string' },
            { name: 'cs_host', type: 'string' },
            { name: 'cs_uri_stem', type: 'string' },
            { name: 'sc_status', type: 'int' },
            { name: 'cs_referrer', type: 'string' },
            { name: 'cs_user_agent', type: 'string' },
            { name: 'cs_uri_query', type: 'string' },
            { name: 'cs_cookie', type: 'string' },
            { name: 'x_edge_result_type', type: 'string' },
            { name: 'x_edge_request_id', type: 'string' },
            { name: 'x_host_header', type: 'string' },
            { name: 'cs_protocol', type: 'string' },
            { name: 'cs_bytes', type: 'bigint' },
            { name: 'time_taken', type: 'float' },
            { name: 'x_forwarded_for', type: 'string' },
            { name: 'ssl_protocol', type: 'string' },
            { name: 'ssl_cipher', type: 'string' },
            { name: 'x_edge_response_result_type', type: 'string' },
            { name: 'cs_protocol_version', type: 'string' },
            { name: 'fle_status', type: 'string' },
            { name: 'fle_encrypted_fields', type: 'int' },
            { name: 'c_port', type: 'int' },
            { name: 'time_to_first_byte', type: 'float' },
            { name: 'x_edge_detailed_result_type', type: 'string' },
            { name: 'sc_content_type', type: 'string' },
            { name: 'sc_content_len', type: 'bigint' },
            { name: 'sc_range_start', type: 'bigint' },
            { name: 'sc_range_end', type: 'bigint' }
          ],
          location: `s3://${cloudFrontLogBucket.bucketName}/`,
          inputFormat: 'org.apache.hadoop.mapred.TextInputFormat',
          outputFormat: 'org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat',
          serdeInfo: {
            serializationLibrary: 'org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe',
            parameters: {
              'serialization.format': '\t',
              'field.delim': '\t'
            }
          }
        },
        parameters: {
          'skip.header.line.count': 2
        },
        tableType: 'EXTERNAL_TABLE'
      }
    })
    glueTable.addDependency(glueDatabase)

    const athenaBucket = new s3.Bucket(this, 'AthenaBucket', {
      bucketName: `ludos-application-athena-${props.envName}`,
      accessControl: BucketAccessControl.LOG_DELIVERY_WRITE,
      removalPolicy: RemovalPolicy.DESTROY
    })
    const workgroup = new athena.CfnWorkGroup(this, 'Workgroup', {
      name: 'cf_workgroup',
      workGroupConfiguration: {
        resultConfiguration: {
          outputLocation: `s3://${athenaBucket.bucketName}/`
        }
      }
    })

    const sampleQuery = new athena.CfnNamedQuery(this, 'SampleNamedQuery', {
      name: 'sample_query',
      queryString: `SELECT * FROM "${glueDbName}"."${glueTableName}" limit 25;`,
      database: glueDbName,
      workGroup: workgroup.name
    })

    sampleQuery.addDependency(workgroup)
  }
}
