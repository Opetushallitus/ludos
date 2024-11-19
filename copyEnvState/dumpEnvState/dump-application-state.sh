#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/common-functions.sh"
# shellcheck source=scripts/psql/db-tunnel.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/psql/db-tunnel.sh"
# shellcheck source=scripts/psql/pg-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../../scripts/psql/pg-functions.sh"

function initialize {
  parse_env_from_script_name "dump-application-state"
  eval "require_aws_session_for_${ENV}"
  initialize_pg_credentials
  create_dump_directory
}

function dump_database {
  echo "Dumping database ${ENV} to ${CURRENT_EXEC_DIR}"
  mkdir "${CURRENT_EXEC_DIR}/database"

  docker run --rm \
    --net=host \
    --mount type=bind,source="${CURRENT_EXEC_DIR}/database",target=/tmp/dump_directory \
    -e PGPASSWORD="${PGPASSWORD}" \
    postgres:15 \
    pg_dump -h 127.0.0.1 -p "${SSH_TUNNEL_PORT}" -U "${USERNAME}" -d "ludos" -b -Fc -f /tmp/dump_directory/db-dump.custom
}

function create_dump_directory {
  local export_root_dirname="${repo}/copyEnvState/dumpEnvState/source-app-state"
  mkdir -p "${export_root_dirname}"
  CURRENT_EXEC_DIR=$(mktemp -d "${export_root_dirname}/run-XXXXXX")
  ln -n -f -s "${CURRENT_EXEC_DIR}" "${export_root_dirname}/latest-${ENV}-dump"
}

function dump_s3_buckets {
  local S3_DIR="${CURRENT_EXEC_DIR}/s3"
  echo "Dumping S3 ${ENV} to ${S3_DIR}"
  mkdir -p "${S3_DIR}"

  copy_bucket "s3://ludos-application-image-bucket-${ENV}" "${S3_DIR}/image"
  copy_bucket "s3://ludos-application-instruction-bucket-${ENV}" "${S3_DIR}/instruction"
  copy_bucket "s3://ludos-application-certificate-bucket-${ENV}" "${S3_DIR}/certificate"
}

function copy_bucket {
  local FROM_BUCKET=${1}
  local TO_DIRECTORY=${2}
  echo "Copying S3 bucket ${FROM_BUCKET} to ${TO_DIRECTORY}"
  mkdir -p "${TO_DIRECTORY}"

  docker run --rm \
    --mount type=bind,source="${TO_DIRECTORY},target=/tmp/${TO_DIRECTORY}" \
    --mount type=bind,source="${HOME}/.aws,target=/root/.aws,readonly" \
    -e AWS_PROFILE \
    -e AWS_REGION \
    -e AWS_DEFAULT_REGION \
    amazon/aws-cli:2.21.3 \
    s3 cp "${FROM_BUCKET}" "/tmp/${TO_DIRECTORY}" --recursive
}

function main() {
  initialize

  ## Copy DB
  create_tunnel
  dump_database
  stop_db_tunnel

  ## Copy S3
  dump_s3_buckets
}

main "$@"