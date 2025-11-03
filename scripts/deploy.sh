#!/usr/bin/env bash
set -euo pipefail

echo "[deploy] 안내"
echo "- 프론트: Vercel에 frontend 디렉터리 연결 (NEXT_PUBLIC_BACKEND_URL 환경변수 설정)"
echo "- 백엔드: Railway에 backend 디렉터리로 Node 서비스 생성 (PORT=3001)"
echo "- DB/Redis는 MVP에서는 불필요(메모리 매칭). 스케일 시 연결 권장"


