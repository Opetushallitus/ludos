#!/bin/bash

source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"

main() {
    use_correct_node_version
    npm_ci_if_package_lock_has_changed
    local -a cdk_args=(--context envName="$ENV")
    if [[ -n "${AWS_PROFILE:-}" ]]; then
        cdk_args+=(--profile "$AWS_PROFILE")
    fi
    npx cdk "${cdk_args[@]}" "$@"
}

main "$@"
