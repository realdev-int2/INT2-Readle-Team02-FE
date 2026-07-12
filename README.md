# Readle Frontend

React, TypeScript, Vite 기반 SPA입니다.

## 시작하기

Node.js 24 LTS가 필요합니다.

```bash
npm ci
npm run dev
```

개발 서버는 `http://localhost:3000`에서 실행됩니다. `/api` 요청은 로컬 Spring Boot(`http://localhost:8080`)로 프록시됩니다.

## 검증

```bash
npm run lint
npm run build
```

## 배포 이미지

```bash
docker build -t readle-frontend .
docker run --rm -p 3000:8080 readle-frontend
```

프로덕션에서는 외부 Nginx가 `/`를 이 컨테이너로, `/api`를 백엔드로 전달합니다.
