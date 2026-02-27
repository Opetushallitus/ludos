#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./02-run-server-tests.sh
source "$repo/deploy-scripts/02-run-server-tests.sh"

function main {
  test-server
}

main
