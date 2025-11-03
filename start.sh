#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/backend"
npm ci --omit=dev || npm i --omit=dev
npm start

