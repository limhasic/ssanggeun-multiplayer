# 쌍근 멀티플레이 게임 — MVP

실시간 1:1 한국어 두 글자 단어 추리 게임의 최소 실행 가능한 버전(MVP)입니다.

## 구조

```
/frontend   # Next.js(React) 클라이언트
/backend    # Node.js(Express + Socket.IO) 서버
/scripts    # 배포 및 유틸 스크립트
```

## 빠른 시작(로컬)

1) 백엔드

```
cd backend
npm i
npm run dev
```

2) 프론트엔드(새 터미널)

```
cd frontend
npm i
npm run dev
```

- 프론트: http://localhost:3000
- 백엔드(Socket): http://localhost:3001

## 관전(스펙)

- 로비에서 닉네임 입력 후 입장 버튼 클릭 → 서버에 등록
- 로비에 현재 진행중 방/플레이어 목록이 실시간 표시
- 닉네임(방) 옆 관전 버튼 클릭 시 관전자 역할로 방에 조인
- 관전자는 `make_guess` 불가, 모든 `guess_result`/`game_over` 이벤트를 실시간 수신

## 주요 기능

- 1:1 매치 대기열(간단 메모리 큐)
- 자모 분해/판정 로직(jamo-judge) 및 유닛 테스트
- Socket 이벤트: join_queue, match_found, room_joined, make_guess, guess_result, game_over
- 클라이언트: 매칭 화면 → 게임 룸(입력, 힌트 그리드)

## 배포(권장: 프론트 Vercel, 백엔드 Railway)

- 프론트: Vercel에 `frontend` 디렉터리를 프로젝트로 연결
- 백엔드: Railway에 `backend`를 Node 서비스로 배포

자세한 절차는 `scripts/deploy.sh`와 각 서비스 대시보드를 참고하세요.

### GitHub 업로드 빠른 명령(Windows PowerShell)

```
cd C:\Users\GRIT\Desktop\make_build
git init
git add -A
git commit -m "feat: MVP + 관전"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/ssanggeun-multiplayer.git
git push -u origin main
```

### Vercel(프론트)
1) Vercel 대시보드 → New Project → Import Git → 리포 선택
2) Root Directory: `frontend`
3) Environment Variables: `NEXT_PUBLIC_BACKEND_URL` = (Railway 백엔드 URL)
4) Deploy

### Railway(백엔드)
1) New Project → Deploy from GitHub → 같은 리포에서 `backend` 선택
2) 포트: 자동(코드에 `process.env.PORT` 지원) 
3) Deploy 후 URL 복사 → Vercel 환경변수에 붙여넣기

## 테스트

```
cd backend
npm test
```

## 라이선스

MVP 샘플 코드. 필요에 따라 수정/확장하세요.


