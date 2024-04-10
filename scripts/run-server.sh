#!/usr/bin/env bash
#
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/common-functions.sh"

function main () {
  echo "brew install gradle"
  echo "brew install openjdk@17"
  echo "set github pat to GITHUB_TOKEN env variable"
  SPRING_PROFILES_ACTIVE=local server/gradlew bootRun -p server bootRun
}

main
