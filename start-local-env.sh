#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
source "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/scripts/common-functions.sh"

function stop() {
  cd "$repo"
  docker compose down || true
}
trap stop EXIT

use_correct_node_version

pushd "$repo/web/"
npm_ci_if_package_lock_has_changed
popd

scripts/update_backups.sh --if-stale


open http://localhost:8080/api/test/mocklogin/YLLAPITAJA

session="ludos"

tmux kill-session -t $session || true
tmux start-server
tmux new-session -d -s $session -c "$repo"

tmux send-keys -t $session "./scripts/run-db.sh" C-m

tmux split-window -v
tmux send-keys -t $session:0.1 "./scripts/watch-web.sh" C-m

tmux split-window -v
tmux send-keys -t $session:0.2 "./scripts/run-server.sh" C-m

tmux split-window -v
tmux send-keys -t $session:0.3 "./scripts/run-frontend.sh" C-m

tmux select-layout -t $session tiled

tmux attach-session -t $session
