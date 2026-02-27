#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./03-run-playwright-tests.sh
source "$repo/deploy-scripts/03-run-playwright-tests.sh"

function main {
  playwright_prepare_env
  trap 'playwright_cleanup; popd' EXIT
  playwright_run_serial_suites
}

main "$@"
