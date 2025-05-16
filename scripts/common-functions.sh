#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# allow sourcing this file multiple times from different scripts
if [ -n "${COMMON_FUNCTIONS_SOURCED:-}" ]; then
  return
fi
readonly COMMON_FUNCTIONS_SOURCED="true"
readonly aws_cli_version="2.22.13"

readonly revision="${GITHUB_SHA:-$(git rev-parse HEAD)}"
readonly repo="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )"
NODE_VERSION="$(cat "$repo/.nvmrc")" && readonly NODE_VERSION

function docker_run_with_aws_env {
  docker run \
    --env AWS_PROFILE \
    --env AWS_REGION \
    --env AWS_DEFAULT_REGION \
    --env AWS_ACCESS_KEY_ID \
    --env AWS_SECRET_ACCESS_KEY \
    --env AWS_SESSION_TOKEN \
    --env BROWSER=/usr/bin/echo \
    --volume "$HOME/.aws:/root/.aws" \
    "$@"
}

function aws {
  docker_run_with_aws_env \
    --rm -i "amazon/aws-cli:$aws_cli_version" "$@"
}

function require_aws_session_for_env {
    local PROFILE="oph-ludos-${1}"
    info "Verifying that AWS session has not expired"

    aws sts get-caller-identity --profile="${PROFILE}" 1>/dev/null || {
      info "Session is expired for profile ${PROFILE}"
      aws --profile "${PROFILE}" sso login --sso-session oph-federation --use-device-code | while read -r line; do echo $line; if echo $line | grep user_code; then open $line; fi; done
    }
    export AWS_PROFILE="${PROFILE}"
    export AWS_REGION="eu-west-1"
    info "Using AWS profile $AWS_PROFILE"
}

function configure_aws_credentials {
  if [[ "${CI:-}" = "true" ]]; then
    export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
    export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    export AWS_SESSION_TOKEN=${AWS_SESSION_TOKEN}

    aws sts get-caller-identity || {
      fatal "Could not check that AWS credentials are working. Please log in with SSO: \"aws --profile oph-ludos-dev sso login\""
    }
  else
    require_aws_session_for_env dev
    export AWS_PROFILE="oph-ludos-dev"
    info "Using AWS profile $AWS_PROFILE"
  fi
  export AWS_REGION="eu-west-1"
  export AWS_DEFAULT_REGION="$AWS_REGION"
}

function use_correct_node_version {
  export NVM_DIR="${NVM_DIR:-$HOME/.cache/nvm}"
  set +o errexit
  source "$repo/scripts/nvm.sh"
  set -o errexit
  nvm use "$NODE_VERSION" || nvm install -b "$NODE_VERSION"
}

function npm_ci_if_package_lock_has_changed {
  info "Checking if npm ci needs to be run"
  require_command shasum
  local -r checksum_file=".package-lock.json.checksum"

  function run_npm_ci {
    npm ci
    shasum package-lock.json > "$checksum_file"
  }

  if [ ! -f "$checksum_file" ]; then
    echo "new package-lock.json; running npm ci"
    run_npm_ci
  elif ! shasum --check "$checksum_file"; then
    info "package-lock.json seems to have changed, running npm ci"
    run_npm_ci
  else
    info "package-lock.json doesn't seem to have changed, skipping npm ci"
  fi
}

function require_command {
  if ! command -v "$1" > /dev/null; then
    fatal "I require $1 but it's not installed. Aborting."
  fi
}

function require_docker {
  require_command docker
  docker ps > /dev/null 2>&1 || fatal "Running 'docker ps' failed. Is docker daemon running? Aborting."
}

function require_docker_compose {
  docker compose > /dev/null || fatal "docker compose missing"
}

function parse_env_from_script_name {
  local BASE_FILENAME="$1"
  FILE_NAME=$(basename "$0")
  if echo "${FILE_NAME}" | grep -E -q "$BASE_FILENAME-.([^-]+)\.sh"; then
    ENV=$(echo "${FILE_NAME}" | sed -E -e "s|$BASE_FILENAME-([^-]+)\.sh|\1|g")
    export ENV
    echo "Targeting environment [${ENV}]"
  else
    echo >&2 "Don't call this script directly"
    exit 1
  fi
}

CURRENT_GROUP=""
GROUP_START_TIME=0
function start_gh_actions_group {
  local group_title="$1"
  GROUP_START_TIME=$(date +%s)
  CURRENT_GROUP="$group_title"

  if [ "${GITHUB_ACTIONS:-}" == "true" ]; then
    echo "::group::$group_title"
  fi
}

function end_gh_actions_group {
  if [ "${GITHUB_ACTIONS:-}" == "true" ]; then
    echo "::endgroup::"
  fi
  END_TIME=$(date +%s)
  info "$CURRENT_GROUP took $(( END_TIME - GROUP_START_TIME )) seconds"
}

function running_on_gh_actions {
  [ "${GITHUB_ACTIONS:-}" == "true" ]
}

function info {
  log "INFO" "$1"
}

function fatal {
  log "ERROR" "$1"
  exit 1
}

function log {
  local -r level="$1"
  local -r message="$2"
  local -r timestamp=$(date +"%Y-%m-%d %H:%M:%S")

  >&2 echo -e "${timestamp} ${level} ${message}"
}

function get_playwright_version {
  cd "$repo/playwright"
  npm list --package-lock-only --json "@playwright/test" | jq --raw-output '.dependencies."@playwright/test".version'
}

function get_secret {
  local name="$1"
  aws secretsmanager get-secret-value --secret-id "$name" --query "SecretString" --output text
}

function wait_until_port_is_listening {
  require_command nc
  local -r port="$1"

  info "Waiting until port $port is listening"
  while ! nc -z localhost "$port"; do
    sleep 1
  done
}

function docker_compose {
  DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 docker compose "$@"

}

function assert_env_var_is_set {
  local var_name="$1"

  if [[ -z "${!var_name+x}" || -z "${!var_name}" ]]; then
    echo "Environment variable '$var_name' is either not set or empty, cannot continue."
    return 1
  fi
}
