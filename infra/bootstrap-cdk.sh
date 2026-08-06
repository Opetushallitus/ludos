#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../scripts/common-functions.sh
source "${SCRIPT_DIR}/../scripts/common-functions.sh"

function configure_target_from_script_name {
  local file_name
  file_name="$(basename "$0")"

  case "$file_name" in
    bootstrap-cdk-untuva.sh)
      AWS_LOGIN_ENV="dev"
      CDK_ENV="untuva"
      AWS_ACCOUNT_ID="782034763554"
      AWS_REGION="eu-west-1"
      ;;
    bootstrap-cdk-qa.sh)
      AWS_LOGIN_ENV="qa"
      CDK_ENV="qa"
      AWS_ACCOUNT_ID="260185049060"
      AWS_REGION="eu-west-1"
      ;;
    bootstrap-cdk-prod.sh)
      AWS_LOGIN_ENV="prod"
      CDK_ENV="prod"
      AWS_ACCOUNT_ID="072794607950"
      AWS_REGION="eu-west-1"
      ;;
    *)
      echo >&2 "Don't call this script directly"
      exit 1
      ;;
  esac

  export AWS_LOGIN_ENV
  export CDK_ENV
  export AWS_ACCOUNT_ID
  export AWS_REGION
}

function run_cdk_bootstrap {
  pushd "$SCRIPT_DIR" > /dev/null
  use_correct_node_version
  npm_ci_if_package_lock_has_changed

  # --app= overrides infra/cdk.json so bootstrap does not synthesize the LUDOS app.
  npx --no-install cdk --app= bootstrap "aws://${AWS_ACCOUNT_ID}/${AWS_REGION}" "$@"
  popd > /dev/null
}

function main {
  configure_target_from_script_name

  if [[ "${LUDOS_CDK_BOOTSTRAP_TEST_MODE:-}" == "1" ]]; then
    echo "AWS_LOGIN_ENV=${AWS_LOGIN_ENV}"
    echo "CDK_ENV=${CDK_ENV}"
    run_cdk_bootstrap "$@"
    return
  fi

  require_aws_session_for_env "$AWS_LOGIN_ENV"
  export_profile_credentials_for_host_tools "oph-ludos-${AWS_LOGIN_ENV}"
  run_cdk_bootstrap "$@"
}

main "$@"
