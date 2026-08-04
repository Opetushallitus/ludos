import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { BackupStack } from '../lib/backupStack'
import { getEnvParameters } from '../lib/envParameters'
import { GithubActionsStack, RESTRICTED_CI_PERMISSIONS_BOUNDARY_NAME } from '../lib/githubActionsStack'
import { S3Stack } from '../lib/S3Stack'

function synthesizeS3AndBackup(envName: 'untuva' | 'qa' | 'prod') {
  const app = new cdk.App()
  const props = getEnvParameters(envName)
  const backupStack = new BackupStack(app, `${props.envNameCapitalized}BackupStack`, props)
  const s3Stack = new S3Stack(app, `${props.envNameCapitalized}S3Stack`, {
    ...props,
    backupStack
  })

  return {
    s3Template: Template.fromStack(s3Stack).toJSON(),
    backupTemplate: Template.fromStack(backupStack).toJSON()
  }
}

test('creates a versioned Glacier remediation archive bucket for untuva', () => {
  const { s3Template } = synthesizeS3AndBackup('untuva')
  const buckets = Object.values(s3Template.Resources).filter((resource: any) => resource.Type === 'AWS::S3::Bucket')
  const archiveBucket: any = buckets.find(
    (resource: any) => resource.Properties?.BucketName === 'ludos-application-glacier-remediation-archive-untuva'
  )

  assert.ok(archiveBucket)
  assert.deepEqual(archiveBucket.Properties.VersioningConfiguration, { Status: 'Enabled' })
  assert.equal(
    archiveBucket.Properties.LifecycleConfiguration.Rules[0].NoncurrentVersionTransitions[0].StorageClass,
    'GLACIER_IR'
  )
})

test('does not add the archive bucket to AWS Backup S3 selections', () => {
  const { backupTemplate } = synthesizeS3AndBackup('untuva')
  const backupSelection = Object.values(backupTemplate.Resources).find(
    (resource: any) => resource.Type === 'AWS::Backup::BackupSelection'
  ) as any

  const resources = JSON.stringify(backupSelection.Properties.BackupSelection.Resources)
  assert.match(resources, /InstructionBucket/)
  assert.match(resources, /CertificateBucket/)
  assert.match(resources, /ImageBucket/)
  assert.doesNotMatch(resources, /GlacierRemediationArchiveBucket/)
})

test('creates the Glacier remediation archive bucket for prod', () => {
  const { s3Template } = synthesizeS3AndBackup('prod')
  const archiveBucket = Object.values(s3Template.Resources).find(
    (resource: any) =>
      resource.Type === 'AWS::S3::Bucket' &&
      resource.Properties?.BucketName === 'ludos-application-glacier-remediation-archive-prod'
  )

  assert.ok(archiveBucket)
})

test('restricted CI permissions do not include operator-only Glacier remediation data access', () => {
  const app = new cdk.App()
  const stack = new GithubActionsStack(app, 'TestGithubActionsStack', getEnvParameters('untuva'))
  const template = Template.fromStack(stack).toJSON()
  const boundary = Object.values(template.Resources).find(
    (resource: any) =>
      resource.Type === 'AWS::IAM::ManagedPolicy' &&
      resource.Properties?.ManagedPolicyName === RESTRICTED_CI_PERMISSIONS_BOUNDARY_NAME
  ) as any
  const statements = [boundary.Properties.PolicyDocument.Statement].flat()
  const actions = new Set(statements.flatMap((statement: any) => [statement.Action].flat()))

  for (const action of [
    's3:ListBucketVersions',
    's3:GetObjectVersion',
    's3:GetObjectAttributes',
    's3:RestoreObject',
    's3:HeadObject'
  ]) {
    assert.equal(actions.has(action), false, `expected restricted CI permissions not to include ${action}`)
  }
})
