#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

readonly CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"


function initialize {
  configure_aws_credentials

  ## Make a backup before overwriting anything, just to be sure
  backup_target_application_state
}

function backup_target_application_state {
  echo "Backing up current application state"
  "${CURRENT_DIR}/dumpEnvState/dump-application-state-untuva.sh"
}

function copy_source_application_state {
  echo "Copying application state"
}

function overwrite_target_s3_state {
  echo "Overwriting S3 state in target bucket"
}

function overwrite_target_database_state {
  echo "Overwriting database state in target DB"
}

function shutdown_target_service {
  echo "Shutting down target service"
    docker build -t copyenvstate:latest -f ./Dockerfile.copyEnvState .
    docker run \
      --rm \
      --mount type=bind,source="${HOME}/.aws,target=/root/.aws,readonly" \
      -e AWS_PROFILE \
      -e AWS_REGION \
      -e AWS_DEFAULT_REGION \
      copyenvstate:latest
}

function start_up_target_service {
  echo "Starting up target service ${ENV}"
}


function main {
  initialize

  copy_source_application_state
  shutdown_target_service
  overwrite_target_s3_state
  overwrite_target_database_state
  start_up_target_service
}

main