# LUDOS-289 AWS Backup S3 Glacier Remediation Plan

## Summary

Fix failing S3 AWS Backup jobs by copying unsupported pre-`2026-04-21` non-current `GLACIER` object versions into a new versioned archive bucket per environment, verifying checksums, and storing the manifest in that same archive bucket.

Rollout order:

1. Run through the `dev` symlink, which maps to `untuva`.
2. Verify `untuva` AWS Backup.
3. Run through the `qa` symlink.
4. Deploy the production archive bucket, but do not run production remediation yet. The `prod` symlink exists but must fail for now.

## Key Changes

- Add a CDK-managed archive bucket in `infra/lib/S3Stack.ts`:
  - name: `ludos-application-glacier-remediation-archive-<env>`
  - versioning enabled
  - block public access
  - object ownership compatible with restores
  - lifecycle for non-current versions uses only AWS Backup-supported storage, preferably `GLACIER_INSTANT_RETRIEVAL`
  - not included in `backupStack.backupS3Buckets(...)`
- Add a TypeScript remediation CLI under `scripts/s3-glacier-remediation/`, using AWS SDK v3.
- Add a bash launcher:
  - real file: `scripts/s3-glacier-remediation/remediate-s3-glacier-backup-failures.sh`
  - symlinks:
    - `scripts/s3-glacier-remediation/remediate-s3-glacier-backup-failures-dev.sh -> remediate-s3-glacier-backup-failures.sh`
    - `scripts/s3-glacier-remediation/remediate-s3-glacier-backup-failures-qa.sh -> remediate-s3-glacier-backup-failures.sh`
    - `scripts/s3-glacier-remediation/remediate-s3-glacier-backup-failures-prod.sh -> remediate-s3-glacier-backup-failures.sh`
  - direct `remediate-s3-glacier-backup-failures.sh` invocation fails.
  - `remediate-s3-glacier-backup-failures-dev.sh` sets target env to `untuva`.
  - `remediate-s3-glacier-backup-failures-qa.sh` sets target env to `qa`.
  - `remediate-s3-glacier-backup-failures-prod.sh` fails with a clear production remediation is not enabled yet error.
- The local operator AWS profile that runs the script needs these S3 data-plane permissions:
  - `s3:ListBucketVersions`
  - `s3:GetObjectVersion`
  - `s3:GetObjectAttributes`
  - `s3:RestoreObject`
  - `s3:PutObject`
  - `s3:HeadObject`
  - `s3:GetObject`

## Launcher Behavior

- Bash launcher uses existing conventions from `scripts/common-functions.sh`.
- It determines environment only from symlink name and fails if called directly or via an unknown name.
- Environment mapping:
  - `remediate-s3-glacier-backup-failures-dev.sh` -> AWS/login env `dev`, remediation env `untuva`
  - `remediate-s3-glacier-backup-failures-qa.sh` -> AWS/login env `qa`, remediation env `qa`
  - `remediate-s3-glacier-backup-failures-prod.sh` -> fail before AWS login or TypeScript execution
- Bash flow:
  - `set -o errexit -o nounset -o pipefail`
  - source `scripts/common-functions.sh`
  - parse symlink name
  - call `require_aws_session_for_env`
  - call `export_profile_credentials_for_host_tools`
  - call `use_correct_node_version`, using the repository `.nvmrc`
  - install script package dependencies if needed
  - run TypeScript with `tsx`
- Example commands:
  - `scripts/s3-glacier-remediation/remediate-s3-glacier-backup-failures-dev.sh remediate`
  - `scripts/s3-glacier-remediation/remediate-s3-glacier-backup-failures-qa.sh remediate`

## TypeScript CLI Behavior

- Commands:
  - `discover`
  - `copy`, which requests temporary read availability for source `GLACIER` versions when needed and copies versions whose restore request has completed.
  - `verify`
  - `remediate`
- Target env comes from the bash launcher as `LUDOS_S3_GLACIER_REMEDIATION_ENV`; the TypeScript CLI must not accept an arbitrary env argument.
- CLI accepts only `untuva` and `qa`; it rejects `prod` defensively.
- Source buckets:
  - `ludos-application-certificate-bucket-<env>`
  - `ludos-application-image-bucket-<env>`
  - `ludos-application-instruction-bucket-<env>`
- Discovery includes only non-current object versions where `StorageClass == GLACIER`, `LastModified < 2026-04-21T00:00:00Z`, and the version is not a delete marker.
- Discovery also checks the expected destination archive object and records `destination_missing` in the manifest when the destination object does not exist.
- Destination:
  - bucket: `ludos-application-glacier-remediation-archive-<env>`
  - key: `objects/<source-bucket>/<base64url(source-key)>/<source-version-id>`
  - storage class: `GLACIER_IR`
- Manifest:
  - stored in the archive bucket at `manifests/s3-glacier-remediation-<env>.json`
  - updated after every phase
  - uploaded as a normal S3 object, so bucket versioning preserves manifest history.
- Checksum verification:
  - download exact source version after `copy` has confirmed the source Glacier restore request has completed
  - compute local SHA-256
  - upload destination object
  - download destination object
  - compute destination SHA-256
  - mark `checksumMatches=true|false`
  - fail fast on mismatch.

## Manifest Shape

Each manifest item must include:

```json
{
  "environment": "untuva",
  "sourceBucket": "ludos-application-certificate-bucket-untuva",
  "sourceKey": "original/key.pdf",
  "sourceVersionId": "abc",
  "sourceLastModified": "2026-04-20T12:00:00.000Z",
  "sourceStorageClass": "GLACIER",
  "sourceETag": "\"...\"",
  "sourceSizeBytes": 12345,
  "destinationBucket": "ludos-application-glacier-remediation-archive-untuva",
  "destinationKey": "objects/ludos-application-certificate-bucket-untuva/<base64url-key>/abc",
  "destinationVersionId": "xyz",
  "sourceSha256": "...",
  "destinationSha256": "...",
  "checksumMatches": true,
  "status": "verified",
  "error": null,
  "updatedAt": "2026-08-04T..."
}
```

Allowed statuses:

`discovered`, `destination_missing`, `restore_requested`, `restore_available`, `copied`, `verified`, `restore_failed`, `copy_failed`, `checksum_mismatch`.

## Rollout Steps

- Deploy archive bucket infra for `untuva`.
- Run:
  - `scripts/s3-glacier-remediation/remediate-s3-glacier-backup-failures-dev.sh remediate`
- Confirm manifest in archive bucket has only `verified` rows and all `checksumMatches=true`.
- Run or wait for an `untuva` AWS Backup job and confirm S3 object failures are gone.
- Deploy archive bucket infra for `qa`.
- Run:
  - `scripts/s3-glacier-remediation/remediate-s3-glacier-backup-failures-qa.sh remediate`
- Confirm QA manifest and AWS Backup result.
- Leave all original source versions untouched.

## Test Plan

- Unit-test discovery filtering for old non-current `GLACIER`, current versions, `GLACIER_IR`, post-cutoff versions, and delete markers.
- Unit-test TypeScript env behavior:
  - accepts `untuva`
  - accepts `qa`
  - rejects `prod`
  - rejects missing env
- Unit-test launcher parsing:
  - direct `remediate-s3-glacier-backup-failures.sh` fails
  - `remediate-s3-glacier-backup-failures-dev.sh` maps to `untuva`
  - `remediate-s3-glacier-backup-failures-qa.sh` maps to `qa`
  - `remediate-s3-glacier-backup-failures-prod.sh` fails before AWS login
- Unit-test manifest state transitions and resumability.
- CDK assertions:
  - archive bucket is versioned
  - archive bucket lifecycle uses AWS Backup-supported storage classes
  - archive bucket is not added to the AWS Backup S3 selection
- Manual acceptance per env:
  - manifest exists in archive bucket
  - every discovered item has a copied destination
  - every copied destination has matching SHA-256
  - source object versions still exist
  - AWS Backup no longer fails on the remediated unsupported versions

## Assumptions

- `dev` symlink means `untuva` remediation.
- Archive bucket is CDK-managed and environment-specific.
- Manifest is the source of truth for resumability and audit history.
- Source objects are not deleted in this implementation.
- Production remediation will be planned separately after `untuva` and `qa` are verified.
