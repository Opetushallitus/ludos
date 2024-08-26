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
  end_gh_actions_group
}

function deploy {
  pushd "$repo"/infra

  PAGERDUTY_ENDPOINT=$( get_secret "/pagerduty/event_url")
  export PAGERDUTY_ENDPOINT
  IMAGE_TAG="$revision" . "./cdk.sh" deploy --all

  popd
}

main
