FROM node:18-alpine

WORKDIR /app

# 백엔드 코드만 복사해 경량 이미지 구성
COPY backend ./backend

WORKDIR /app/backend

RUN npm ci --omit=dev || npm i --omit=dev

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["npm", "start"]


