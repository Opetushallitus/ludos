import * as cdk from 'aws-cdk-lib'
import { aws_cloudwatch_actions, Duration, Tags } from 'aws-cdk-lib'
import * as rds from 'aws-cdk-lib/aws-rds'
import { DatabaseInstanceProps } from 'aws-cdk-lib/aws-rds'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'
import { CommonStackProps } from '../types'
import { BackupPlan, BackupResource } from 'aws-cdk-lib/aws-backup'
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch'
import * as sns from 'aws-cdk-lib/aws-sns'

const rdsInstanceEngine = rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_15_2 })

export interface LudosDatabaseInstanceProps extends Omit<DatabaseInstanceProps, 'engine' | 'vpc'> {
  instanceType: ec2.InstanceType
}

export interface DbStackProps extends CommonStackProps {
  vpc: ec2.Vpc
  databaseInstancePropOverrides: LudosDatabaseInstanceProps
  productionGrade: boolean
  databaseUser: string
  backupRetention?: cdk.Duration
  parameters?: Record<string, string>
  backupPlan: BackupPlan
  alarmSnsTopic: sns.Topic
}

export class DbStack extends cdk.Stack {
  public dbSecurityGroup: ec2.SecurityGroup
  public instance: rds.DatabaseInstance
  public masterPasswordSecret: rds.DatabaseSecret

  constructor(scope: Construct, id: string, props: DbStackProps) {
    super(scope, id, props)

    const defaultAllocatedStorage = 20
    const allocatedStorage = props.databaseInstancePropOverrides.allocatedStorage ?? defaultAllocatedStorage

    const rdsParameterGroup = new rds.ParameterGroup(this, 'RdsParameterGroup', {
      engine: rdsInstanceEngine,
      parameters: {
        log_temp_files: '0', // kilobytes
        ...props.parameters
      }
    })

    this.masterPasswordSecret = new rds.DatabaseSecret(this, 'MasterPasswordSecret', {
      secretName: `/${this.node.path}/DatabaseMasterPassword`,
      username: props.databaseUser
    })

    this.dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc: props.vpc
    })

    this.instance = new rds.DatabaseInstance(this, 'DatabaseInstance', {
      engine: rdsInstanceEngine,
      allowMajorVersionUpgrade: true,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      credentials: rds.Credentials.fromSecret(this.masterPasswordSecret),
      multiAz: props.productionGrade,
      securityGroups: [this.dbSecurityGroup],
      deletionProtection: props.productionGrade,
      allocatedStorage: defaultAllocatedStorage,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      cloudwatchLogsExports: ['postgresql', 'upgrade'],
      backupRetention: props.productionGrade ? cdk.Duration.days(35) : cdk.Duration.days(7),
      preferredBackupWindow: '04:00-06:00', // UTC time
      preferredMaintenanceWindow: 'Tue:02:00-Tue:04:00', // UTC time
      monitoringInterval: props.productionGrade ? cdk.Duration.seconds(10) : undefined,
      enablePerformanceInsights: props.productionGrade,
      removalPolicy: props.productionGrade ? cdk.RemovalPolicy.SNAPSHOT : cdk.RemovalPolicy.DESTROY,
      parameterGroup: rdsParameterGroup,
      ...props.databaseInstancePropOverrides
    })
    Tags.of(this.instance).add('Name', `${props.envNameCapitalized}Db`)
    Tags.of(this.instance).add('Environment', props.envName)

    new secretsmanager.SecretRotation(this, 'MasterPasswordSecretRotation', {
      application: secretsmanager.SecretRotationApplication.POSTGRES_ROTATION_SINGLE_USER,
      secret: this.masterPasswordSecret,
      target: this.instance,
      automaticallyAfter: Duration.days(1000), // Disable until app can handle automatic rotation on-the-fly
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      }
    })

    props.backupPlan.addSelection(`DbBackupSelection`, {
      backupSelectionName: `${props.envNameCapitalized}LudosDbBackupSelection`,
      resources: [BackupResource.fromRdsDatabaseInstance(this.instance)]
    })

    if (props.envName === 'untuva') {
      const alarmSnsAction = new aws_cloudwatch_actions.SnsAction(props.alarmSnsTopic)

      const DISK_SPACE_20_PERCENT = (allocatedStorage / 5) * 1024 * 1024 * 1024
      const freeStorageSpaceLow = new cloudwatch.Alarm(this, 'FreeStorageSpaceLow', {
        alarmName: `${this.node.id}: RDS storage space low`,
        alarmDescription: `${this.node.id}: RDS storage space low`,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD,
        threshold: DISK_SPACE_20_PERCENT,
        evaluationPeriods: 3,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        metric: this.instance.metricFreeStorageSpace({ period: cdk.Duration.minutes(5) })
      })
      freeStorageSpaceLow.addOkAction(alarmSnsAction)
      freeStorageSpaceLow.addAlarmAction(alarmSnsAction)

      const freeableMemoryLow = new cloudwatch.Alarm(this, 'FreeableMemoryLow', {
        alarmName: `${this.node.id}: RDS freeable memory low`,
        alarmDescription: `${this.node.id}: RDS freeable memory low`,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD,
        threshold: 0.5 * (1024 * 1024 * 1024),
        evaluationPeriods: 3,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        metric: this.instance.metricFreeableMemory({ period: cdk.Duration.minutes(5) })
      })
      freeableMemoryLow.addOkAction(alarmSnsAction)
      freeableMemoryLow.addAlarmAction(alarmSnsAction)
    }
  }
}
