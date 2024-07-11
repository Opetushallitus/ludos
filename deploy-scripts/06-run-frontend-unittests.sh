#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

function frontend_unit_tests {
  pushd web
  npm_ci_if_package_lock_has_changed
  npx vitest run
  popd
}


function main {
    cd "$repo"
    frontend_unit_tests
}

main "$@"
