#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../common-functions.sh
source "${SCRIPT_DIR}/../common-functions.sh"

function configure_target_from_script_name {
  local file_name
  file_name="$(basename "$0")"

  case "$file_name" in
    remediate-s3-glacier-backup-failures-dev.sh)
      AWS_LOGIN_ENV="dev"
      LUDOS_S3_GLACIER_REMEDIATION_ENV="untuva"
      ;;
    remediate-s3-glacier-backup-failures-qa.sh)
      AWS_LOGIN_ENV="qa"
      LUDOS_S3_GLACIER_REMEDIATION_ENV="qa"
      ;;
    remediate-s3-glacier-backup-failures-prod.sh)
      AWS_LOGIN_ENV="prod"
      LUDOS_S3_GLACIER_REMEDIATION_ENV="prod"
      ;;
    *)
      echo >&2 "Don't call this script directly"
      exit 1
      ;;
  esac

  export AWS_LOGIN_ENV
  export LUDOS_S3_GLACIER_REMEDIATION_ENV
}

function main {
  configure_target_from_script_name

  if [[ "${LUDOS_S3_GLACIER_REMEDIATION_TEST_MODE:-}" == "1" ]]; then
    echo "AWS_LOGIN_ENV=${AWS_LOGIN_ENV}"
    echo "LUDOS_S3_GLACIER_REMEDIATION_ENV=${LUDOS_S3_GLACIER_REMEDIATION_ENV}"
    return
  fi

  require_aws_session_for_env "$AWS_LOGIN_ENV"
  export_profile_credentials_for_host_tools "oph-ludos-${AWS_LOGIN_ENV}"
  use_correct_node_version
  info "Running S3 Glacier remediation command '$*' for ${LUDOS_S3_GLACIER_REMEDIATION_ENV}"

  pushd "$SCRIPT_DIR" > /dev/null
  npm_ci_if_package_lock_has_changed
  npx tsx src/index.ts "$@"
  popd > /dev/null
}

main "$@"
