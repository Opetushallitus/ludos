#!/bin/bash
set -o errexit -o nounset -o pipefail

## Backup S3 data before audit test, which is expected to mess up whole QA

export AWS_PROFILE=oph-ludos-qa

function backup_s3_buckets() {

  aws s3 sync s3://ludos-application-certificate-bucket-qa s3://ludos-application-pre-audit-backup/certificates/
  aws s3 sync s3://ludos-application-image-bucket-qa s3://ludos-application-pre-audit-backup/images/
  aws s3 sync s3://ludos-application-instruction-bucket-qa s3://ludos-application-pre-audit-backup/instructions/

}

backup_s3_buckets