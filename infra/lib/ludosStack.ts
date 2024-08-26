import * as cdk from 'aws-cdk-lib'
import { RemovalPolicy } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { VpcStack } from './vpcStack'
import { EnvParameters } from './envParameters'
import { AlbStack } from './albStack'
import { EcsStack } from './ecsStack'
import { LudosApplicationStack } from './ludosApplicationStack'
import { HostedZoneStack } from './hostedZoneStack'
import { SecurityGroupsStack } from './securityGroupsStack'
import { DbStack, LudosDatabaseInstanceProps } from './dbStack'
import { BastionStack } from './bastionStack'
import { LogGroupStack } from './logGroupStack'
import { CloudFrontCertificateStack } from './cloudfrontCertificateStack'
import { S3Stack } from './S3Stack'
import { GithubActionsStack } from './githubActionsStack'
import { BackupStack } from './backupStack'
import { AlarmStack } from './alarmStack'
import { SecretStack } from './secretStack'

interface LudosStackProps extends EnvParameters {
  domain: string
  productionGrade: boolean
  db: LudosDatabaseInstanceProps
  ludosApplicationImageTag: string
  enableAccessFromGithubActions: boolean
}

export class LudosStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LudosStackProps) {
    super(scope, id, props)

    const { env, envName, envNameCapitalized, vpcParameters } = props
    const commonProps = { env, envName, envNameCapitalized }

    const vpcStack = new VpcStack(this, 'VpcStack', {
      ...commonProps,
      ...vpcParameters
    })

    const hostedZoneStack = new HostedZoneStack(this, `HostedZoneStack`, {
      crossRegionReferences: true,
      ...commonProps,
      domain: props.domain
    })

    const githubActionsStack = props.enableAccessFromGithubActions
      ? new GithubActionsStack(this, 'GithubActionsStack', commonProps)
      : undefined

    const securityGroupsStack = new SecurityGroupsStack(this, `SecurityGroupsStack`, {
      ...commonProps,
      vpc: vpcStack.vpc
    })

    const secretStack = new SecretStack(this, 'SecretStack', commonProps, githubActionsStack?.githubActionsRole!)

    const alarmStack = new AlarmStack(this, 'AlarmStack', commonProps)

    new BastionStack(this, 'BastionStack', {
      ...commonProps,
      vpc: vpcStack.vpc,
      securityGroup: securityGroupsStack.bastionSecurityGroup
    })

    const backupStack = new BackupStack(this, 'BackupStack', {
      ...commonProps
    })

    const dbStack = new DbStack(this, 'DbStack', {
      ...commonProps,
      vpc: vpcStack.vpc,
      productionGrade: props.productionGrade,
      databaseUser: 'ludosdba',
      databaseInstancePropOverrides: props.db,
      backupPlan: backupStack.backupPlan,
      alarmSnsTopic: alarmStack.alarmSnsTopic
    })
    securityGroupsStack.setDbSecurityGroup(dbStack.dbSecurityGroup)

    const albStack = new AlbStack(this, 'AlbStack', {
      ...commonProps,
      vpc: vpcStack.vpc,
      securityGroup: securityGroupsStack.albSecurityGroup
    })

    const ecsStack = new EcsStack(this, 'EcsStack', {
      ...commonProps,
      vpc: vpcStack.vpc
    })

    const ludosApplicationLogGroupStack = new LogGroupStack(this, 'LudosApplicationLogGroupStack', {
      ...commonProps,
      vpc: vpcStack.vpc,
      serviceName: 'LudosApplication',
      removalPolicy: props.productionGrade ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
    })
    const ludosApplicationAuditLogLogGroupStack = new LogGroupStack(this, 'LudosApplicationAuditLogLogGroupStack', {
      ...commonProps,
      vpc: vpcStack.vpc,
      serviceName: 'LudosApplicationAuditLog',
      removalPolicy: props.productionGrade ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
    })

    const cloudFrontCertificateStack = new CloudFrontCertificateStack(this, 'CloudFrontCertificateStack', {
      crossRegionReferences: true,
      ...commonProps,
      env: { ...commonProps.env, region: 'us-east-1' },
      hostedZone: hostedZoneStack.zone,
      domain: props.domain
    })

    const s3BucketStack = new S3Stack(this, 'S3BucketStack', {
      ...commonProps,
      backupStack: backupStack
    })

    new LudosApplicationStack(this, 'LudosApplicationStack', {
      crossRegionReferences: true,
      ...commonProps,
      ludosApplicationImageTag: props.ludosApplicationImageTag,
      productionGrade: props.productionGrade,
      vpc: vpcStack.vpc,
      ecsCluster: ecsStack.cluster,
      securityGroup: securityGroupsStack.serviceSecurityGroup,
      logGroupStack: ludosApplicationLogGroupStack,
      auditLogLogGroupStack: ludosApplicationAuditLogLogGroupStack,
      albStack,
      hostedZone: hostedZoneStack.zone,
      domain: props.domain,
      cloudFrontCertificate: cloudFrontCertificateStack.certificate,
      dbStack,
      s3BucketStack,
      githubActionsStack,
      alarmSnsTopic: alarmStack.alarmSnsTopic
    })

    securityGroupsStack.createRules()
  }
}
