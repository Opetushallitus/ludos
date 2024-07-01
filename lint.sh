#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( dirname "${BASH_SOURCE[0]}" )/scripts/common-functions.sh"

function main() {
  use_correct_node_version
  pushd playwright
  npm_ci_if_package_lock_has_changed
  npm run lint
  popd
}

main