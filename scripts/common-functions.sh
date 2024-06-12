#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# allow sourcing this file multiple times from different scripts
if [ -n "${COMMON_FUNCTIONS_SOURCED:-}" ]; then
  return
fi
readonly COMMON_FUNCTIONS_SOURCED="true"

readonly revision="${GITHUB_SHA:-$(git rev-parse HEAD)}"
readonly repo="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )"
readonly NODE_VERSION="v20.11.0"

read -r -d '' AWS_CLI_DOCKERFILE <<EOF || true
FROM public.ecr.aws/aws-cli/aws-cli:2.10.1
RUN echo "image/webp webp" >> /etc/mime.types
RUN echo "font/woff woff" >> /etc/mime.types
RUN echo "font/woff2 woff2" >> /etc/mime.types
EOF

function maybe_build_aws_cli {
  local aws_cli_dockerfile_temp="$repo/.aws-cli.Dockerfile"
  echo "$AWS_CLI_DOCKERFILE" > "$aws_cli_dockerfile_temp"

  require_command shasum
  local -r checksum_file="$aws_cli_dockerfile_temp.checksum"

  function build_aws_cli {
    echo "$AWS_CLI_DOCKERFILE" | docker build --tag "amazon/aws-cli:local" -
    shasum "$aws_cli_dockerfile_temp" > "$checksum_file"
  }

  if [ ! $(docker images -q amazon/aws-cli:local) ]; then
    echo "no amazon/aws-cli:local image found; running docker build"
    build_aws_cli
  elif [ ! -f "$checksum_file" ]; then
    echo "no checksum for aws cli dockerfile; running docker build"
    build_aws_cli
  elif ! shasum --check "$checksum_file"; then
    info "aws cli dockerfile seems to have changed, running docker build"
    build_aws_cli
  else
    info "aws cli dockerfile doesn't seem to have changed, skipping docker build"
  fi
}

function aws {
  require_docker
  maybe_build_aws_cli 1>&2 # output redirected to stderr so that if someone wants to use the stdout of the CLI command, it's possible
  docker run \
    --env AWS_PROFILE \
    --env AWS_ACCESS_KEY_ID \
    --env AWS_SECRET_ACCESS_KEY \
    --env AWS_SESSION_TOKEN \
    --env AWS_REGION \
    --env AWS_DEFAULT_REGION \
    --rm -i \
    --pull=never \
    --volume "${HOME}/.aws:/root/.aws" -v "$( pwd ):/aws" \
    amazon/aws-cli:local \
    "$@"
}

function configure_aws_credentials {
  if [[ "${CI:-}" = "true" ]]; then
    export AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
    export AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    export AWS_SESSION_TOKEN=${AWS_SESSION_TOKEN}
  else
    export AWS_PROFILE="oph-ludos-dev"
    info "Using AWS profile $AWS_PROFILE"
  fi
  export AWS_REGION="eu-west-1"
  export AWS_DEFAULT_REGION="$AWS_REGION"

  aws sts get-caller-identity || {
    fatal "Could not check that AWS credentials are working. Please log in with SSO: \"aws --profile oph-ludos-dev sso login\""
  }
}

function is_aws_configured {
  if [[ (-z "${AWS_SECRET_ACCESS_KEY:-}") && (-z "${AWS_PROFILE:-}") ]]; then
    fatal "AWS credentials not configured, call configure_aws_credentials in the script before getting a secret"
  fi
}

function get_secret {
  local secret_id=$1

  is_aws_configured
  aws secretsmanager get-secret-value --secret-id "$secret_id" --query SecretString --output text
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

