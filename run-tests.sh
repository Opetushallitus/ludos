#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"



function server_tests {
  pushd server
  ./gradlew test --rerun-tasks
  popd
}

function frontend_unit_tests {
  pushd web
  npm_ci_if_package_lock_has_changed
  npx vitest run
  popd
}

readonly RESULTS_DIR="$repo/playwright/playwright-results"


function playwright_tests {
  mkdir -p "$RESULTS_DIR"

  docker build -t playwright-image -f Dockerfile.playwright --build-arg="PLAYWRIGHT_VERSION=$(get_playwright_version)" .

  docker run -it \
  --network ludos_default \
  -v "$RESULTS_DIR":/playwright/playwright-results \
  -v "$repo/playwright/snapshots":/playwright/snapshots \
  -v "$repo/playwright/parallel_tests":/playwright/parallel_tests \
  -v "$repo/playwright/non_parallel_tests":/playwright/non_parallel_tests \
  -v "$repo/playwright/assertPdfDownload.ts":/playwright/assertPdfDownload.ts \
  -v "$repo/playwright/models":/playwright/models \
  --env HEADLESS=true \
  ${RUN_LOCAL_TESTS_IN_UI_MODE:+--env RUN_LOCAL_TESTS_IN_UI_MODE} \
  ${RUN_LOCAL_TESTS_IN_UI_MODE:+-p 127.0.0.1:9876:9876} \
  ${RUN_LOCAL_TESTS_IN_UI_MODE:+-t -i} \
  playwright-image "$@"
}


function main {
  configure_aws_credentials
  playwright_tests "$@"
  frontend_unit_tests
  server_tests
}

main "$@"
