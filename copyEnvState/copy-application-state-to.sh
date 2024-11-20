#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

readonly CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"
# shellcheck source=scripts/psql/db-tunnel.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/psql/db-tunnel.sh"
# shellcheck source=scripts/psql/pg-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/psql/pg-functions.sh"


function initialize {
  setup_target_and_source_env_variables
  configure_aws_credentials

}

function setup_target_and_source_env_variables {
  parse_env_from_script_name "copy-application-state-to" ## Setup "ENV" variable
  export TARGET_ENVIRONMENT="${ENV}"

  if [[ "${TARGET_ENVIRONMENT}" == "untuva" ]]; then
    export SOURCE_ENVIRONMENT="qa"
  elif [[ "${TARGET_ENVIRONMENT}" == "qa" ]]; then
    export SOURCE_ENVIRONMENT="prod"
  else
    echo "Invalid target environment ${TARGET_ENVIRONMENT}"
    exit 1
  fi
}

function backup_target_application_state {
  echo "Backing up current application state"
  "${CURRENT_DIR}/dumpEnvState/dump-application-state-${TARGET_ENVIRONMENT}.sh"
}

function copy_source_application_state {
  echo "Copying application state"
  "${CURRENT_DIR}/dumpEnvState/dump-application-state-${SOURCE_ENVIRONMENT}.sh"
}

function overwrite_target_s3_state {
  echo "Overwriting S3 state in target bucket"
  copy_state_to_s3 image
  copy_state_to_s3 certificate
  copy_state_to_s3 instruction
}

function copy_state_to_s3 {
  local FROM_DIRECTORY="$repo/copyEnvState/dumpEnvState/source-app-state/latest-$SOURCE_ENVIRONMENT-dump/s3/$1"
  local TO_BUCKET="s3://ludos-application-$1-bucket-$TARGET_ENVIRONMENT"
  echo "Copying dir ${FROM_DIRECTORY}" to S3 bucket "$TO_BUCKET"

  docker run --rm \
    --mount type=bind,source="${FROM_DIRECTORY},target=/tmp/${FROM_DIRECTORY},readonly" \
    --mount type=bind,source="${HOME}/.aws,target=/root/.aws,readonly" \
    -e AWS_PROFILE \
    -e AWS_REGION \
    -e AWS_DEFAULT_REGION \
    amazon/aws-cli:2.21.3 \
    s3 sync "/tmp/${FROM_DIRECTORY}" "$TO_BUCKET" --recursive --delete
}

function overwrite_target_database_state {
  echo "Overwriting ${TARGET_ENVIRONMENT} database state in target DB"

  eval "require_aws_session_for_${TARGET_ENVIRONMENT}"
  initialize_pg_credentials
  create_tunnel

  STORED_STATE_DIRECTORY="${CURRENT_DIR}/dumpEnvState/source-app-state/latest-${SOURCE_ENVIRONMENT}-dump"

  docker run --rm \
      --net=host \
      --mount type=bind,source="${STORED_STATE_DIRECTORY}/database",target=/tmp/dump_directory \
      -e PGPASSWORD="${PGPASSWORD}" \
      postgres:15 \
      pg_restore \
        -h 127.0.0.1 \
        -p "${SSH_TUNNEL_PORT}" \
        -U "${USERNAME}" \
        -d "postgres" \
        --verbose \
        --clean --create --exit-on-error /tmp/dump_directory/db-dump.custom

  echo "--------------------------------"
  echo "DB state has been replaced in ${TARGET_ENVIRONMENT}"
  stop_db_tunnel
}

function shutdown_target_service {
  echo "Shutting down target service"
    docker build -t copyenvstate:latest -f "$CURRENT_DIR/Dockerfile.copyEnvState" "$CURRENT_DIR"
    docker run \
      --rm \
      --mount type=bind,source="${HOME}/.aws,target=/root/.aws,readonly" \
      -e AWS_PROFILE \
      -e AWS_REGION \
      -e AWS_DEFAULT_REGION \
      copyenvstate:latest
}

function start_up_target_service {
  echo "Starting up target service ${TARGET_ENVIRONMENT}"
}


function main {
  initialize


  ## Make a backup before overwriting anything, just to be sure
  backup_target_application_state

  copy_source_application_state
  shutdown_target_service
  overwrite_target_s3_state
  overwrite_target_database_state
  start_up_target_service
}

main