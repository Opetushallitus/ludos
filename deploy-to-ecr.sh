#!/usr/bin/env bash

set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

function main {
  start_group "Setup"
  use_correct_node_version
  configure_aws_credentials
  BUILD_ID="$(git rev-parse HEAD)"
  export BUILD_ID
  end_group

  start_group "Build"
  "$repo"/scripts/build-web.sh
  "$repo"/scripts/build-server.sh
  end_group

  start_group "Test"
  "$repo"/scripts/run-tests.sh
  end_group
}

main
