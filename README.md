# Readle Frontend

Readle의 웹 화면을 제공하고 Spring Boot API와 통신하는 프론트엔드 SPA입니다.
브라우저에서 실행되는 React 애플리케이션이며, 개발 서버와 운영 정적 파일 서버는
백엔드와 분리되어 있습니다.

## 기술 스택

| 구분 | 기술 | 역할 |
| --- | --- | --- |
| UI | React 19, TypeScript | 화면과 클라이언트 로직 작성 |
| 빌드 | Vite 8 | 개발 서버, 번들링, 개발용 API 프록시 |
| 라우팅 | React Router 8 | SPA의 URL별 페이지 렌더링 |
| 서버 상태 | TanStack Query | API 서버 상태와 캐시 정책 관리 |
| 스타일 | Tailwind CSS 4 | UI 스타일 작성 |
| API Mock | MSW | 개발 환경의 백엔드 API Mock 제공 |
| 품질 | ESLint, Vitest | 정적 코드 검사와 단위 테스트 |
| 배포 | Docker, Nginx, GHCR | 정적 파일 이미지 빌드 및 제공 |
| 자동화 | GitHub Actions | PR 검증 및 `main` 이미지 발행 |

정확한 패키지 버전은 `package.json`과 `package-lock.json`을 기준으로 합니다.

## 로컬 개발

### 준비 사항

- Node.js 24 (`.nvmrc` 기준)
- npm 11 (`package.json`의 `engines` 기준)
- API까지 연동할 경우 `http://localhost:8080`에서 실행 중인 Spring Boot 백엔드

```bash
nvm use
npm ci
cp .env.example .env
npm run dev
```

개발 서버는 `http://localhost:3000`에서 실행됩니다. 포트 3000이 이미 사용 중이면
다른 포트로 자동 변경하지 않고 종료됩니다.

`npm ci`는 `package-lock.json`에 고정된 의존성을 그대로 설치합니다. 의존성을
추가하거나 제거할 때만 `npm install <package>` 또는 `npm uninstall <package>`를
사용하고, 변경된 `package.json`과 `package-lock.json`을 함께 커밋합니다.

### npm 명령어

| 명령어 | 역할 |
| --- | --- |
| `npm ci` | lockfile을 기준으로 의존성을 깨끗하게 설치 |
| `npm run dev` | Vite 개발 서버 실행 (`localhost:3000`) |
| `npm run lint` | ESLint로 코드 오류와 규칙 위반 검사 |
| `npm run test` | Vitest 단위 테스트 실행 |
| `npm run build` | TypeScript 검사 후 운영용 정적 파일을 `dist/`에 생성 |
| `npm run preview` | 빌드 결과를 로컬에서 미리 확인하는 서버 실행 |

`build`와 `preview`는 운영 서버에 배포하는 명령이 아닙니다. 실제 운영 이미지는
GitHub Actions가 `main` 기준으로 빌드하고 GHCR에 발행합니다.

## 프로젝트 구조

```text
src/
├── app/       # 앱 초기화, 전역 Provider, Router
├── mocks/     # 개발 환경에서 사용하는 MSW handler와 fixture
├── pages/     # URL 단위 화면 구성
├── widgets/   # 여러 feature/entity를 조합한 큰 화면 블록
├── features/  # 로그인, 퀴즈 제출 등 사용자 행동 단위 기능
├── entities/  # User, Content, Quiz 등 도메인 모델과 UI
└── shared/    # 도메인에 종속되지 않는 API, UI, 설정, 스타일, 유틸리티
```

현재 코드가 없는 `widgets`, `features`, `entities` 디렉터리는 미리 만들지 않습니다.
필요한 책임의 첫 코드가 생길 때 생성합니다. 의존성은 다음 방향으로만 흐릅니다.

```text
app → pages → widgets → features → entities → shared
```

- 하위 레이어는 상위 레이어를 import하지 않습니다.
- 페이지 전용 코드는 재사용성이 확인되기 전까지 `shared`로 이동하지 않습니다.
- `@/` import alias는 `src/`를 가리킵니다.

세부 원칙은 [`src/README.md`](src/README.md)를 참고합니다.

## 프론트엔드와 백엔드 통신 구조

프론트엔드는 백엔드 주소를 컴포넌트마다 직접 작성하지 않고 `/api`로 요청합니다.
환경에 따라 `/api`를 전달하는 주체가 달라집니다.

### 개발 환경

```text
브라우저
  ├─ 화면 요청 ──────> Vite (localhost:3000)
  └─ /api 요청 ─────> Vite proxy ─────> Spring Boot (localhost:8080)
```

`vite.config.ts`가 `/api` 요청을 로컬 Spring Boot로 프록시합니다. 브라우저에는
프론트엔드와 API가 모두 `localhost:3000`에서 제공되는 것처럼 보이므로 로컬 개발
중 별도의 CORS 우회 주소를 코드에 넣지 않아도 됩니다.

`VITE_USE_MOCK=true`이면 MSW가 브라우저에서 `/api` 요청을 먼저 처리합니다.
`VITE_USE_MOCK=false`이면 MSW를 시작하지 않고 Vite proxy가 같은 요청을
`http://localhost:8080`의 Spring Boot 백엔드로 전달합니다. `/api` prefix는
rewrite하지 않습니다.

예를 들어 프론트엔드의 `/api/{endpoint}` 요청은 개발 환경에서
`http://localhost:8080/api/{endpoint}`로 전달됩니다. 실제 endpoint는 백엔드 API
명세를 기준으로 사용합니다.

### 운영 환경

```text
브라우저 ──> Edge Nginx
               ├─ /     ──> readle-frontend:8080 (정적 SPA)
               └─ /api  ──> Spring Boot 백엔드
```

프론트엔드 이미지 안의 Nginx는 React 정적 파일과 SPA fallback만 담당합니다.
운영 환경의 `/api` 분기는 외부 Edge Nginx가 담당하므로 프론트엔드 컨테이너는
백엔드 주소를 알 필요가 없습니다.

## 환경 변수와 비밀값

로컬 Mock API 사용 여부는 다음 환경변수로 제어합니다.

```env
VITE_USE_MOCK=true
```

- `true`: 개발 환경에서 MSW를 시작합니다.
- `false`: MSW를 시작하지 않고 `/api` 요청을 Vite proxy로 전달합니다.
- 운영 빌드에서는 값과 관계없이 MSW를 시작하지 않습니다.

새 변수가 필요하면 공개 가능한 클라이언트 설정만 `VITE_` 접두사로 정의하고 사용
예시는 `.env.example`에 추가합니다.

- `VITE_` 변수는 빌드 결과에 포함되어 브라우저 사용자에게 노출될 수 있습니다.
- API Key, 비밀번호, DB 접속 정보, 토큰 등 비밀값을 프론트엔드 환경 변수에 넣지 않습니다.
- `.env`, `.env.*`는 커밋하지 않습니다. 예시 파일인 `.env.example`만 추적할 수 있습니다.
- 환경별 API 주소를 컴포넌트에 하드코딩하지 않고 기본적으로 상대 경로 `/api`를 사용합니다.
- 비밀값이 필요한 처리는 Spring Boot 백엔드에서 수행합니다.

## Mock API

백엔드 비즈니스 API가 준비되기 전에도 화면을 개발할 수 있도록 개발 환경에서 MSW를
사용합니다. Mock handler도 실제 외부 계약과 같은 `/api` 하위 경로를 사용합니다.

현재 제공하는 endpoint는 다음과 같습니다.

```text
GET  /api/auth/session
GET  /api/users/me
POST /api/contents/extract
POST /api/contents
GET  /api/contents/:contentId/validation
```

콘텐츠 검증 상태는 기본적으로 첫 두 번의 조회에서 `pending`, 세 번째 조회부터
`passed`를 반환합니다. handler 자체를 점검할 때만 `mockScenario` query로 terminal
상태를 강제할 수 있습니다.

```text
/api/contents/101/validation?mockScenario=pending
/api/contents/101/validation?mockScenario=passed
/api/contents/101/validation?mockScenario=rejected
/api/contents/101/validation?mockScenario=failed
```

크롤링 실패는 요청 URL에 `extract-fail`을 포함해 재현합니다.

```json
{
  "url": "https://extract-fail.example.com/article"
}
```

Mock 전용 조건은 MSW handler 내부에만 두며 실제 API 함수의 request contract에는
추가하지 않습니다. 백엔드 endpoint가 완성되면 `.env`에서 `VITE_USE_MOCK=false`로
변경하여 같은 프론트엔드 API 함수를 실제 서버에 연결합니다.

## Git 협업 규칙

작업은 반드시 **이슈 생성 → 최신 `main` pull → 브랜치 생성 → 작업 → PR → 리뷰 → 머지**
순서로 진행합니다. `main`에는 직접 push하지 않습니다.

### 이슈와 브랜치

- 이슈 및 PR 제목: `[feat] 크루 생성 API 구현`과 같은 형식
- 기능 브랜치: `feat/{이슈번호}-{작업명}` (예: `feat/12-auth-jwt`)
- 버그 브랜치: `fix/{이슈번호}-{작업명}`
- 머지된 브랜치는 즉시 삭제
- 이슈와 PR 본문은 `.github`의 템플릿 사용

### 커밋

| 타입 | 용도 |
| --- | --- |
| `feat` | 새로운 기능 |
| `fix` | 버그 수정 |
| `refactor` | 기능 변경 없는 리팩터링 |
| `style` | 포매팅 등 코드 스타일 변경 |
| `docs` | 문서 수정 |
| `test` | 테스트 추가 또는 수정 |
| `chore` | 설정, 빌드, 파일·폴더 변경 등 기타 작업 |
| `ci` | CI/CD 설정 변경 |

커밋 메시지에는 이슈 번호를 포함합니다.

```text
feat: 로그인 기능 구현 (#10)
```

### PR과 리뷰

- PR의 머지 대상은 `main`이며 제목은 연결된 이슈 제목과 동일하게 작성
- 최소 1명의 승인 후 머지
- 리뷰는 24시간 이내 완료를 목표로 함
- `Approve`: 머지 가능, `Request Changes`: 수정 후 재요청, `Comment`: 선택적 의견
- CodeRabbit 리뷰는 참고용이며 사람 리뷰를 대체하지 않음
- PR은 가능하면 파일 5~10개, 코드 200~500줄, 리뷰 30분 이내 규모로 유지

## 배포와 운영

GitHub Actions는 CI가 성공한 `main` push만 GHCR 이미지를 발행하고 `production` 환경 배포를 시작합니다.

```text
ghcr.io/<owner>/<repository>:<full-github-sha>
ghcr.io/<owner>/<repository>:main
```

배포는 `publish-image`가 반환한 OCI digest와 전체 Git SHA를 함께 사용합니다. `:main`은 편의 태그이며, 겹치는 publish 작업 사이에 특정 commit을 가리킨다고 보장하지 않습니다. EC2 배포 입력으로 사용하지 않습니다. 이미지 경로는 소문자로 정규화한 `${{ github.repository }}`를 기준으로 하므로 저장소 transfer 후 새 조직/저장소 경로로 발행됩니다.

### 프로덕션 배포 계약

배포 job은 `contents: read` 권한만 받고 GitHub Environment의 SSH 비밀값으로 EC2의 고정 명령만 실행합니다.

- secrets: `EC2_SSH_PRIVATE_KEY`, `EC2_KNOWN_HOSTS`
- variables: `EC2_HOST`, `EC2_USER`

EC2는 rootful Podman으로 `readle-public` 네트워크에서 호스트 포트 없이 `readle-frontend`를 실행합니다. 같은 네트워크의 Edge Nginx가 `/`를 `http://readle-frontend:8080`으로 프록시하고 `/api`는 백엔드로 전달합니다.

GHCR 패키지는 비공개로 유지합니다. EC2에는 `read:packages`와 해당 패키지 읽기 권한만 가진 전용 자격 증명을 `GHCR_USERNAME`, `GHCR_PULL_TOKEN`으로만 보관합니다.

```bash
printf '%s' "$GHCR_PULL_TOKEN" | sudo podman login ghcr.io -u "$GHCR_USERNAME" --password-stdin
```

호스트의 `/etc/readle/frontend-image-repository`는 배포 가능한 GHCR 저장소를 하나만 허용합니다. 저장소 transfer 시 이 값을 새 `ghcr.io/<owner>/<repository>`로 변경하고 새 패키지에 pull 권한을 부여합니다. 설치, immutable digest 배포, rollback 절차는 [`ops/frontend/README.md`](ops/frontend/README.md)를 따릅니다.

### 로컬 이미지 확인

로컬에서 배포 이미지 자체를 검증할 때만 Docker를 사용합니다.

```bash
docker build -t readle-frontend .
docker run --rm -p 3000:8080 readle-frontend
```

이 실행은 로컬 확인용이며 EC2 배포를 수행하지 않습니다.

### 운영 health check

- 운영 주소: <http://52.79.230.19/>

```bash
curl --fail --max-time 5 http://52.79.230.19/
curl --fail --max-time 5 http://127.0.0.1/
sudo podman inspect --format '{{.State.Health.Status}}' readle-frontend
```

Dockerfile health check는 컨테이너 내부 `http://127.0.0.1:8080/` 응답을 확인합니다. 2026-07-13 현재 작업 환경에서는 운영 주소 연결이 8초 내 성립하지 않았습니다. 서비스 장애로 단정하지 않으며 EC2 상태, 보안 그룹, Edge Nginx를 인프라 담당자와 함께 확인해야 합니다.

## 변경 전 검증

```bash
npm ci
npm run lint
npm run test
npm run build
```

## 미확정 및 확인 필요 사항

- 운영 주소 `http://52.79.230.19/`의 지속 사용 여부와 도메인·HTTPS 적용 계획
- 프론트엔드에서 사용할 API 목록, 응답 형식, 오류 코드, 인증 방식
- 운영 환경에서 추가로 필요한 공개 클라이언트 환경 변수
- GitHub Environment와 EC2 간 실제 배포·rollback E2E 확인
- `.github` 이슈/PR 템플릿의 백엔드 전용 문구와 프론트엔드 협업 규칙 통일
