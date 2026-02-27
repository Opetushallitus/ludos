#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./03-run-playwright-tests.sh
source "$repo/deploy-scripts/03-run-playwright-tests.sh"

function main {
  local shard_index="${1:?missing shard index}"
  local shard_total="${2:-4}"

  playwright_prepare_env
  trap 'playwright_cleanup; popd' EXIT
  playwright_run_all_projects_shard "$shard_index" "$shard_total"
}

main "$@"
