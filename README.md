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

GitHub Actions가 `main` 브랜치에 push되고 CI가 성공하면 다음 GHCR 이미지를 발행합니다.

```
ghcr.io/<repository-owner>/int2-readle-team02-fe:<full-github-sha>
ghcr.io/<repository-owner>/int2-readle-team02-fe:main
```

배포는 전체 Git SHA 태그로 배포할 소스 리비전을 식별해 선택합니다. `:main`은 최신 이미지를 확인하기 위한 편의 태그이며, EC2는 rootful Podman으로 `readle-public` 네트워크에서 호스트 포트 없이 `readle-frontend`를 실행합니다.

GHCR 패키지는 비공개로 유지합니다. EC2에는 `read:packages`와 해당 패키지 읽기 권한만 가진 전용 자격 증명을 `GHCR_USERNAME`, `GHCR_PULL_TOKEN`으로만 보관하고, 이 저장소에는 저장하지 않습니다.

```bash
printf '%s' "$GHCR_PULL_TOKEN" | sudo podman login ghcr.io -u "$GHCR_USERNAME" --password-stdin
sudo podman pull ghcr.io/<repository-owner>/int2-readle-team02-fe:<full-github-sha>
sudo podman run -d --restart=always --name readle-frontend \
  --network readle-public \
  ghcr.io/<repository-owner>/int2-readle-team02-fe:<full-github-sha>
```

같은 `readle-public` 네트워크의 엣지 Nginx 컨테이너가 `/`를 `http://readle-frontend:8080`으로 프록시합니다. 이 저장소는 EC2 배포 자동화나 인증 설정을 제공하지 않습니다.
