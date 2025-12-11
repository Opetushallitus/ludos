#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

function server_tests {
  pushd server
  ./gradlew test --rerun-tasks
  popd
}

readonly RESULTS_DIR="$repo/playwright/playwright-results"

function playwright_compose_tests {
  mkdir -p "$RESULTS_DIR"
  PLAYWRIGHT_VERSION=$(get_playwright_version) docker compose build playwright

  docker compose up playwright
}


function main {
  configure_aws_credentials
  playwright_compose_tests "$@"
  server_tests
}

if [[ "${1:-}" == "--ui" ]]; then
  open http://127.0.0.1:9876/
  RUN_LOCAL_TESTS_IN_UI_MODE=true main "$@"
else
  main "$@"
fi