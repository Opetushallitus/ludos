import * as cdk from 'aws-cdk-lib/core'
import { RemovalPolicy } from 'aws-cdk-lib/core'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { BucketAccessControl, ObjectOwnership } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import { CommonStackProps } from '../types'
import { BackupStack } from './backupStack'
import { capitalize } from '../utils'

interface S3StackProps extends CommonStackProps {
  backupStack: BackupStack
}

export class S3Stack extends cdk.Stack {
  public readonly instructionBucket: s3.Bucket
  public readonly certificateBucket: s3.Bucket
  public readonly imageBucket: s3.Bucket
  constructor(scope: Construct, id: string, props: S3StackProps) {
    super(scope, id, props)

    this.instructionBucket = this.newBucket('instruction', props)
    this.certificateBucket = this.newBucket('certificate', props)
    this.imageBucket = this.newBucket('image', props)

    props.backupStack.backupS3Buckets(this.allBuckets()) // Backup all buckets stored in this.X automatically
  }

  newBucket(bucketId: string, props: S3StackProps): s3.Bucket {
    return new s3.Bucket(this, `${capitalize(bucketId)}Bucket`, {
      bucketName: `ludos-application-${bucketId}-bucket-${props.envName}`,
      accessControl: BucketAccessControl.PRIVATE,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true, // Required for taking backups
      objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED, // Required for restoring backups
      lifecycleRules: [
        {
          noncurrentVersionExpiration: cdk.Duration.days(2 * 365),
          noncurrentVersionTransitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(30)
            }
          ]
        }
      ],
      removalPolicy: RemovalPolicy.RETAIN
    })
  }

  allBuckets(): s3.Bucket[] {
    return Object.values(this).flatMap((v) => (v instanceof s3.Bucket ? v : []))
  }
}
