#!/usr/bin/env bash
# Kill leftover Firebase emulators, vite, tsc -w, and seed processes that
# previous dev sessions left running. Safe to re-run.
set -u

PATTERNS=(
  'firebase emulators'
  'cloud-firestore-emulator'
  'cloud-storage-rules-runtime'
  'firebase-tools'
  'tsc -w'
  'tsc --watch'
  'vite'
  'seed-firestore.mjs'
)

EMULATOR_PORTS=(4000 5000 5001 8080 9099 9199)

echo "[kill-stale] pattern sweep"
for p in "${PATTERNS[@]}"; do
  pids=$(pgrep -f "$p" || true)
  if [ -n "$pids" ]; then
    echo "  killing '$p' → $pids"
    echo "$pids" | xargs kill -TERM 2>/dev/null || true
  fi
done

sleep 1

echo "[kill-stale] port sweep"
for port in "${EMULATOR_PORTS[@]}"; do
  pids=$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "  port $port still held by $pids → SIGKILL"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
done

echo "[kill-stale] done"
