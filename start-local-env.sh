#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

SERVER_ENV="$(dirname "$0")/../ludos/server/.env"
PLAYWRIGHT_ENV="$(dirname "$0")/../ludos/playwright/.env"
FETCH_SECRETS_SCRIPT="$(dirname "$0")/../ludos/scripts/fetch_secrets.sh"

function stop() {
  docker compose -f docker-compose-db.yaml down
}
trap stop EXIT

use_correct_node_version
scripts/update_backups.sh --if-stale

check_env_files() {
    if [[ ! -f "$SERVER_ENV" ]] || [[ ! -f "$PLAYWRIGHT_ENV" ]]; then
        return 1
    else
        return 0
    fi
}

if ! check_env_files; then
    echo "Secrets not found, logging in to AWS SSO.."
    aws --profile oph-ludos-dev sso login && aws --profile oph-ludos-utility sso login

    echo "running fetch-secrets.sh..."
    bash "$FETCH_SECRETS_SCRIPT"

    if ! check_env_files; then
        echo "Failed to fetch secrets. Please check the fetch_secrets.sh script and your AWS credentials."
        exit 1
    fi
fi

session="ludos"

tmux kill-session -t $session || true
tmux start-server
tmux new-session -d -s $session -c "$repo"

tmux send-keys -t $session "./scripts/run-db.sh" C-m

tmux split-window -v
tmux send-keys -t $session:0.1 "./scripts/run-server.sh" C-m

tmux split-window -h
tmux send-keys -t $session:0.2 "./scripts/run-web.sh" C-m

tmux select-layout -t $session tiled

tmux attach-session -t $session
