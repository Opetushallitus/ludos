#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
set -o errtrace

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

function remind_about_full_developer_permissions_on_error {
  local exit_code="$?"
  if ! running_on_gh_actions && [[ "${DEPLOY_PERMISSION_MODE:-restricted}" == "restricted" ]]; then
    echo >&2 "Restricted deploy failed. Retry with --full-developer-permissions if you need broader permissions."
  fi
  exit "$exit_code"
}

function main {
  start_gh_actions_group "Setup"
  parse_deploy_permission_mode_args "$@"
  trap remind_about_full_developer_permissions_on_error ERR
  parse_env_from_script_name "..-deploy"
  use_correct_node_version
  end_gh_actions_group

  start_gh_actions_group "Deploy $ENV"
  deploy
  healthcheck
  end_gh_actions_group
}

function deploy {
  pushd "$repo"/infra

  use_local_deploy_aws_credentials "$ENV"
  PAGERDUTY_ENDPOINT=$( get_secret "/pagerduty/event_url")
  export PAGERDUTY_ENDPOINT
  local -a cdk_args=(deploy --all)
  append_cdk_restricted_role_args "$ENV" cdk_args
  IMAGE_TAG="$revision" . "./cdk.sh" "${cdk_args[@]}"

  popd
}

function healthcheck() {
  declare -A domains
  domains["untuva"]="https://ludos.untuvaopintopolku.fi/api/health-check"
  domains["qa"]="https://ludos.testiopintopolku.fi/api/health-check"
  domains["prod"]="https://ludos.opintopolku.fi/api/health-check"

  URL="${domains[$ENV]}"
  echo "Verifying ${URL} is up"

  function doCheck() {
    httpStatusCode=$(curl --write-out '%{http_code}' --silent --output /dev/null "${URL}")
    echo "${httpStatusCode}"
  }

  local count=0
  local maxCount=30
  until [[ "$(doCheck)" == "200"  ]]; do
    count=$((count + 1))

    if (( count > maxCount )); then
       echo "${URL} is not healthy, exiting"
       exit 123
    fi

    echo "${URL} is not healthy yet. Attempt ${count}/${maxCount}"
    sleep 5
  done

  echo "${URL} is healthy, deployment was success"
}

main "$@"
