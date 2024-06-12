#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"


function serverTests {
  pushd server
  ./gradlew test --rerun-tasks
  popd
}

function main {
  configure_aws_credentials
  serverTests
}

main
