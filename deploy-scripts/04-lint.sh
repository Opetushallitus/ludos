#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail

# shellcheck source=../scripts/common-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

# shellcheck source=./deploy-functions.sh
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/deploy-functions.sh"

function main {
    cd "$repo"
    use_correct_node_version

    start_gh_actions_group "Lint web"
    pushd web
    npm_ci_if_package_lock_has_changed
    npm run lint
    popd
    end_gh_actions_group

    start_gh_actions_group "Lint playwright"
    pushd playwright
    npm_ci_if_package_lock_has_changed
    npm run lint
    popd
    end_gh_actions_group
}

main "$@"
