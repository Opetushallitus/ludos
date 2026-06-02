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
  if [[ "$run_playwright" == true ]]; then
    playwright_compose_tests
  fi
  if [[ "$run_server" == true ]]; then
    server_tests
  fi
}

run_server=true
run_playwright=true
ui_mode=false

for arg in "$@"; do
  case "$arg" in
    --only-server) run_playwright=false ;;
    --only-playwright) run_server=false ;;
    --ui) ui_mode=true ;;
    *)
      echo "Unknown option: $arg" >&2
      echo "Usage: $(basename "$0") [--only-server | --only-playwright] [--ui]" >&2
      exit 1
      ;;
  esac
done

if [[ "$run_server" == false && "$run_playwright" == false ]]; then
  echo "--only-server and --only-playwright are mutually exclusive" >&2
  exit 1
fi

# --ui only applies to the Playwright run; ignored when Playwright is skipped (e.g. --only-server)
if [[ "$ui_mode" == true && "$run_playwright" == true ]]; then
  open http://127.0.0.1:9876/
  export RUN_LOCAL_TESTS_IN_UI_MODE=true
fi

main