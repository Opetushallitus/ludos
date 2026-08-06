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

function require_full_developer_permissions_flag {
  local arg
  for arg in "$@"; do
    if [[ "$arg" == "--full-developer-permissions" ]]; then
      return
    fi
  done

  fatal "deploy-utility.sh must be run with --full-developer-permissions. Restricted utility deploys can break the AWS stack."
}

function main {
  parse_deploy_permission_mode_args "$@"
  require_full_developer_permissions_flag "$@"

  start_gh_actions_group "Setup"
  trap remind_about_full_developer_permissions_on_error ERR
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
  append_cdk_restricted_role_args utility cdk_args
  . "./cdk.sh" "${cdk_args[@]}"
}

main "$@"
