#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"



function server_tests {
  pushd server
  ./gradlew test --rerun-tasks
  popd
}

# readonly RESULTS_DIR="$repo/playwright/playwright-results"
# function get_playwright_version {
#   cd "$repo/playwright"
#   npm list --package-lock-only --json "@playwright/test" | jq --raw-output '.dependencies."@playwright/test".version'
# }

# function playwright_tests {
#   # mkdir -p "$RESULTS_DIR"

#   docker build -t playwright-image -f Dockerfile.playwright --build-arg="PLAYWRIGHT_VERSION=$(get_playwright_version)" .

#   docker run -it --rm --network ludos_default \
#   -v "$RESULTS_DIR":/playwright/playwright-results \
#   --env HEADLESS=true \
#   ${RUN_LOCAL_TESTS_IN_UI_MODE:+--env RUN_LOCAL_TESTS_IN_UI_MODE} \
#   ${RUN_LOCAL_TESTS_IN_UI_MODE:+-p 127.0.0.1:9876:9876} \
#   ${RUN_LOCAL_TESTS_IN_UI_MODE:+-t -i} \
#   playwright-image "$@"
# }


function playwright_tests {
  pushd playwright
  npm_ci_if_package_lock_has_changed
  npx playwright install
  HEADLESS=true npx playwright test --workers 4 "$@"
}




function main {
  configure_aws_credentials
  playwright_tests "$@"
  # server_tests
}

main "$@"
