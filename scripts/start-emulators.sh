#!/usr/bin/env bash
# Safe wrapper: kills stale processes, caps Java/Node heap, then starts emulators.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

bash "$DIR/scripts/kill-stale.sh"

export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS:--Xmx1g -Xms128m}"
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}"

echo "[emulators] JAVA_TOOL_OPTIONS=$JAVA_TOOL_OPTIONS"
echo "[emulators] NODE_OPTIONS=$NODE_OPTIONS"

cd "$DIR"
FIREBASE_ARGS=("$@")
if [ ${#FIREBASE_ARGS[@]} -eq 0 ]; then
  # Skip hosting emulator by default — vite serves the SPA on :5173 and port 5000
  # is commonly held by macOS AirPlay Receiver.
  FIREBASE_ARGS=(--only auth,functions,firestore,storage)
fi

exec firebase emulators:start "${FIREBASE_ARGS[@]}"
