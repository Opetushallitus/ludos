import * as cdk from 'aws-cdk-lib'
import {
  BackupPlan,
  BackupPlanProps,
  BackupPlanRule,
  BackupResource,
  BackupVaultEvents,
  CfnBackupVault,
  CfnRestoreTestingPlan,
  CfnRestoreTestingSelection
} from 'aws-cdk-lib/aws-backup'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as events from 'aws-cdk-lib/aws-events'
import { Schedule } from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions'
import { Construct } from 'constructs'
import * as path from 'path'
import { CommonStackProps } from '../types'

interface BackupStackProps extends CommonStackProps {}

export class BackupStack extends cdk.Stack {
  public backupPlan: BackupPlan
  private readonly s3BackupRole: iam.Role
  private readonly s3RestoreRole: iam.Role
  private readonly restoreTestingPlan: CfnRestoreTestingPlan
  private readonly restoreTestingRole: iam.Role
  private props: BackupStackProps

  constructor(scope: Construct, id: string, props: BackupStackProps) {
    super(scope, id, props)

    this.props = props
    const planProps: BackupPlanProps = {
      backupPlanName: `${props.envNameCapitalized}LudosBackupPlan`,
      backupPlanRules: [
        new BackupPlanRule({
          ruleName: 'Daily',
          scheduleExpression: Schedule.cron({
            hour: '22', // UTC time
            minute: '0'
          }),
          startWindow: cdk.Duration.hours(2),
          deleteAfter: cdk.Duration.days(35)
        }),
        new BackupPlanRule({
          ruleName: 'Monthly7Year',
          scheduleExpression: Schedule.cron({
            day: '1',
            hour: '20', // UTC time
            minute: '0'
          }),
          startWindow: cdk.Duration.hours(2),
          moveToColdStorageAfter: cdk.Duration.days(30 * 3),
          deleteAfter: cdk.Duration.days(365 * 7)
        })
      ]
    }

    this.backupPlan = new BackupPlan(this, 'BackupPlan', planProps)

    this.s3BackupRole = new iam.Role(this, 'S3BackupRole', {
      assumedBy: new iam.ServicePrincipal('backup.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSBackupServiceRolePolicyForS3Backup'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSBackupServiceRolePolicyForS3Restore')
      ]
    })
    this.addKmsPermissions(this.s3BackupRole)

    this.s3RestoreRole = new iam.Role(this, 'AwsBackupS3RestoreRole', {
      // For manual S3 snapshot restore operations
      roleName: 'AwsBackupS3RestoreRole',
      assumedBy: new iam.ServicePrincipal('backup.amazonaws.com'),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AWSBackupServiceRolePolicyForS3Restore')]
    })
    this.addKmsPermissions(this.s3RestoreRole)

    const backupEventsLogGroup = new logs.LogGroup(this, 'BackupEventsLogGroup', {
      logGroupName: `/aws/events/${props.envName}/ludos-backup-jobs`,
      retention: logs.RetentionDays.ONE_MONTH
    })

    new events.Rule(this, 'BackupJobStateChangeRule', {
      ruleName: `${props.envNameCapitalized}BackupJobStateChange`,
      description: 'Log terminal AWS Backup job state changes for dev environments',
      eventPattern: {
        source: ['aws.backup'],
        detailType: ['Backup Job State Change'],
        detail: {
          state: ['COMPLETED', 'FAILED', 'EXPIRED', 'ABORTED']
        }
      },
      targets: [new targets.CloudWatchLogGroup(backupEventsLogGroup)]
    })

    const backupNotificationsTopic = new sns.Topic(this, 'BackupNotificationsTopic', {
      topicName: `${props.envNameCapitalized}BackupNotificationsTopic`,
      displayName: `${props.envNameCapitalized} Ludos Backup Notifications`
    })
    backupNotificationsTopic.addToResourcePolicy(
      new iam.PolicyStatement({
        principals: [new iam.ServicePrincipal('backup.amazonaws.com')],
        actions: ['sns:Publish'],
        resources: [backupNotificationsTopic.topicArn]
      })
    )

    const backupNotificationLogGroup = new logs.LogGroup(this, 'BackupNotificationLogGroup', {
      logGroupName: `/aws/lambda/ludos/${props.envName}/backup-notifications`,
      retention: logs.RetentionDays.ONE_MONTH
    })

    const backupNotificationLoggerLambda = new lambda.Function(this, 'BackupNotificationLoggerLambda', {
      functionName: `${props.envNameCapitalized}BackupNotificationLogger`,
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(60),
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambdas/backupNotificationLoggerLambda')),
      logGroup: backupNotificationLogGroup
    })

    backupNotificationsTopic.addSubscription(new subscriptions.LambdaSubscription(backupNotificationLoggerLambda))

    const backupVault = this.backupPlan.backupVault.node.defaultChild as CfnBackupVault
    backupVault.notifications = {
      backupVaultEvents: [
        BackupVaultEvents.S3_BACKUP_OBJECT_FAILED,
        BackupVaultEvents.BACKUP_JOB_FAILED,
        BackupVaultEvents.BACKUP_JOB_STARTED
      ],
      snsTopicArn: backupNotificationsTopic.topicArn
    }

    this.restoreTestingRole = new iam.Role(this, 'RestoreTestingRole', {
      assumedBy: new iam.ServicePrincipal('backup.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSBackupServiceRolePolicyForRestores')
      ]
    })
    this.addKmsPermissions(this.restoreTestingRole)

    this.restoreTestingPlan = new CfnRestoreTestingPlan(this, 'RestoreTestingPlan', {
      restoreTestingPlanName: `${props.envNameCapitalized}LudosRestoreTestingPlan`,
      scheduleExpression: 'cron(30 15 ? * * *)',
      scheduleExpressionTimezone: 'Europe/Helsinki',
      startWindowHours: 4,
      recoveryPointSelection: {
        algorithm: 'LATEST_WITHIN_WINDOW',
        includeVaults: [this.backupPlan.backupVault.backupVaultArn],
        recoveryPointTypes: ['SNAPSHOT'],
        selectionWindowDays: 7
      }
    })

    new events.Rule(this, 'RestoreTestingJobStateChangeRule', {
      ruleName: `${props.envNameCapitalized}RestoreTestingJobStateChange`,
      description: 'Log AWS Backup restore job state changes',
      eventPattern: {
        source: ['aws.backup'],
        detailType: ['Restore Job State Change']
      },
      targets: [new targets.CloudWatchLogGroup(backupEventsLogGroup), new targets.SnsTopic(backupNotificationsTopic)]
    })
  }

  addRestoreJobAlarming(alarmSnsTopic: sns.Topic) {
    new events.Rule(this, 'RestoreJobAlarmRule', {
      ruleName: `${this.props.envNameCapitalized}RestoreJobAlarm`,
      description: 'Alarm on AWS Backup restore job state changes (PagerDuty/Slack test)',
      eventPattern: {
        source: ['aws.backup'],
        detailType: ['Restore Job State Change']
      },
      targets: [new targets.SnsTopic(alarmSnsTopic)]
    })
  }

  backupS3Buckets(buckets: s3.Bucket[]) {
    this.backupPlan.addSelection(`BucketBackupSelection`, {
      backupSelectionName: `${this.props.envNameCapitalized}LudosBucketBackupSelection`,
      resources: buckets.map((bucket) => BackupResource.fromArn(bucket.bucketArn)),
      role: this.s3BackupRole
    })
  }

  addRdsRestoreTesting(instance: rds.DatabaseInstance, securityGroup: ec2.SecurityGroup) {
    const cfnDbInstance = instance.node.defaultChild as rds.CfnDBInstance
    const dbSubnetGroupName = cfnDbInstance.dbSubnetGroupName
    if (!dbSubnetGroupName) {
      throw new Error('Expected the RDS instance to have an auto-generated dbSubnetGroupName')
    }

    new CfnRestoreTestingSelection(this, 'RdsRestoreTestingSelection', {
      restoreTestingPlanName: this.restoreTestingPlan.restoreTestingPlanName,
      restoreTestingSelectionName: `${this.props.envNameCapitalized}LudosRdsRestoreTestingSelection`,
      protectedResourceType: 'RDS',
      iamRoleArn: this.restoreTestingRole.roleArn,
      protectedResourceArns: ['*'],
      restoreMetadataOverrides: {
        dbInstanceClass: 'db.t3.micro',
        dbSubnetGroupName: dbSubnetGroupName,
        vpcSecurityGroupIds: `["${securityGroup.securityGroupId}"]`
      }
    })
  }

  private addKmsPermissions(role: iam.Role) {
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'kms:Decrypt',
          'kms:DescribeKey',
          'kms:Encrypt',
          'kms:GenerateDataKey',
          'kms:ReEncryptFrom',
          'kms:ReEncryptTo'
        ],
        resources: ['*']
      })
    )
  }
}
