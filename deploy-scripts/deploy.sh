#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

function main {
  start_gh_actions_group "Setup"
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

  PAGERDUTY_ENDPOINT=$( get_secret "/pagerduty/event_url")
  export PAGERDUTY_ENDPOINT
  IMAGE_TAG="$revision" . "./cdk.sh" deploy --all

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

main
