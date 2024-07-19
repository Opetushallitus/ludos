#!/bin/bash

source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/../scripts/common-functions.sh"



ensure_no_missing_git_commits() {
    if [ -n "${SKIP_MISSING_GIT_COMMITS_CHECK:-}" ]; then
        echo "Skip checking that all commits in origin/main are present in HEAD"
    else
        echo "Checking all commits in origin/main are present in HEAD"
        git fetch origin main || exit 1
        echo
        local missing_git_commits
        missing_git_commits=$(git log --oneline '^HEAD' 'origin/main')
        if [ -n "$missing_git_commits" ]; then
            echo "ERROR: origin/main has unpulled commits:"
            echo "$missing_git_commits"
            exit 1
        fi
    fi
}

main() {
    use_correct_node_version
    npm_ci_if_package_lock_has_changed
    ensure_no_missing_git_commits
    npx cdk --context envName="$ENV" "$@"
}

main "$@"