#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

function main {
  start_gh_actions_group "Setup"
  parse_deploy_permission_mode_args "$@"
  parse_env_from_script_name "deploy"
  use_correct_node_version
  end_gh_actions_group

  start_gh_actions_group "Deploy $ENV"
  deploy_utility
  end_gh_actions_group
}

function deploy_utility {
  use_local_deploy_aws_credentials utility
  local -a cdk_args=(deploy --all)
  IMAGE_TAG=dummy . "./cdk.sh" "${cdk_args[@]}"
}

main "$@"
