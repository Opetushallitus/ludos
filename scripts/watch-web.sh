#!/usr/bin/env bash
#
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

function main () {
  pushd "$repo"/web
  npm_ci_if_package_lock_has_changed
  npm run watch
  popd
}

main
