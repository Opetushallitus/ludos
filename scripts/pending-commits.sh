#!/usr/bin/env bash

set -o errexit -o nounset -o pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

git fetch --tags --force > /dev/null

function log_cmd {
  local fmt="%C(bold blue)%h%C(reset) %C(green)(%cI)%C(reset) %s %C(cyan)<%an>%C(reset)"
  git --no-pager log --pretty=format:"$fmt" --color --left-only "$@"
}

function print_pending_commits {
  echo "# Commits for qa -> prod"
  log_cmd green-qa...green-prod && echo

  echo "# Commits for dev -> qa"
  log_cmd green-dev...green-qa && echo

  echo "# Commits for origin/main -> dev"
  log_cmd origin/main...green-dev && echo

  echo "# Commits for main -> origin/main"
  log_cmd main...origin/main && echo
}

print_pending_commits "$@" | less --no-init --quit-if-one-screen --RAW-CONTROL-CHARS
