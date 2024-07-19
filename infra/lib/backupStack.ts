import * as cdk from 'aws-cdk-lib'
import { BackupPlan, BackupPlanProps, BackupPlanRule, BackupResource } from 'aws-cdk-lib/aws-backup'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import { CommonStackProps } from '../types'
import { Schedule } from 'aws-cdk-lib/aws-events'

interface BackupStackProps extends CommonStackProps {}

export class BackupStack extends cdk.Stack {
  public backupPlan: BackupPlan
  private readonly s3BackupRole: iam.Role
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
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AWSBackupServiceRolePolicyForS3Backup')]
    })

    new iam.Role(this, 'AwsBackupS3RestoreRole', {
      // For manual S3 snapshot restore operations
      roleName: 'AwsBackupS3RestoreRole',
      assumedBy: new iam.ServicePrincipal('backup.amazonaws.com'),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('AWSBackupServiceRolePolicyForS3Restore')]
    })
  }

  backupS3Buckets(buckets: s3.Bucket[]) {
    this.backupPlan.addSelection(`BucketBackupSelection`, {
      backupSelectionName: `${this.props.envNameCapitalized}LudosBucketBackupSelection`,
      resources: buckets.map((bucket) => BackupResource.fromArn(bucket.bucketArn)),
      role: this.s3BackupRole
    })
  }
}
