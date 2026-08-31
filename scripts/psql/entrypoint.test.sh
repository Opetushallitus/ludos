#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
query=$(sed -n '/DB_HOSTNAME=/,/--output text/p' "${script_dir}/entrypoint.sh")

if [[ "${query}" != *"!starts_with(DBInstanceIdentifier, 'awsbackup-restore-test')"* ]]; then
  echo "The RDS discovery query must exclude AWS Backup restore-test instances" >&2
  exit 1
fi

echo "entrypoint RDS discovery query test passed"
