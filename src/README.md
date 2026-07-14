# Source structure

Readle 프론트엔드는 화면과 도메인의 책임을 분리하기 위해 아래 레이어를 사용합니다.

```text
src/
├── app/       # 앱 초기화, 전역 Provider, Router
├── mocks/     # 개발 전용 MSW handler와 fixture
├── pages/     # URL 단위 화면 구성
├── widgets/   # 여러 feature/entity를 조합한 큰 화면 블록
├── features/  # 로그인, 퀴즈 제출 등 사용자 행동 단위 기능
├── entities/  # User, Content, Quiz 등 도메인 모델과 UI
└── shared/    # 도메인에 종속되지 않는 API, UI, 설정, 스타일, 유틸리티
```

## Dependency direction

의존 방향은 다음 순서로만 흐릅니다.

```text
app → pages → widgets → features → entities → shared
```

- 하위 레이어는 상위 레이어를 import하지 않습니다.
- 같은 레이어의 다른 도메인을 직접 참조하지 않습니다.
- 페이지에서만 쓰는 코드는 재사용 가능성이 확인되기 전까지 `shared`로 이동하지 않습니다.
- 절대 경로 import의 `@/`는 `src/`를 가리킵니다.

## Directory creation

Git은 빈 디렉터리를 추적하지 않으므로 `.gitkeep`으로 레이어를 미리 만들지 않습니다. `widgets`, `features`, `entities`는 해당 책임을 가진 첫 코드가 추가될 때 생성합니다.
