#!/usr/bin/env bash
#
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

function main () {
  pushd "$repo"/localizations
  use_correct_node_version
  npm_ci_if_package_lock_has_changed
  node localizations.ts "$@"
  popd
}

main "$@"
