# Shared UI

Readle의 도메인에 종속되지 않는 공통 UI 컴포넌트입니다. 색상, 타이포그래피,
간격, 모서리, 그림자, breakpoint는 `src/shared/styles/global.css`의 `@theme`에서
관리합니다. 컴포넌트에서는 임의의 색상값이나 간격값 대신 의미가 드러나는 토큰을
사용합니다.

## Components

- `Button`: primary, secondary, ghost, danger 및 disabled/loading 상태
- `Input`: label, 설명, 오류 메시지와 접근성 속성이 연결된 입력
- `Textarea`: Input과 같은 규칙을 사용하는 여러 줄 입력
- `Loading`: 스크린 리더에 상태를 알리는 로딩 표시
- `ErrorMessage`: 오류를 즉시 알리는 공통 메시지
- `PageContainer`: 모바일·데스크톱 공통 너비와 좌우 여백

```tsx
import { Button, Input, PageContainer } from '@/shared/ui'

export function Example() {
  return (
    <PageContainer>
      <Input label="제목" error="제목을 입력해주세요." required />
      <Button loading={false}>저장</Button>
    </PageContainer>
  )
}
```

## Manual verification

개발 서버를 실행하고 `http://localhost:3000/design-system`에 접속합니다. 이 경로는
Vite 개발 환경에서만 렌더링됩니다.

- Button, Input, Textarea가 정상적으로 렌더링되는지 확인
- hover, focus, disabled, loading, error 상태 확인
- Tab 키로 모든 활성 컨트롤에 이동할 수 있고 focus가 표시되는지 확인
- label을 클릭하면 연결된 Input 또는 Textarea로 focus가 이동하는지 확인
- 오류 입력에 `aria-invalid`와 오류 메시지 연결이 적용되는지 확인
- 모바일과 데스크톱 너비에서 가로 스크롤이나 레이아웃 깨짐이 없는지 확인

## Layout

- 모바일 최소 지원 너비: 320px
- 기본 콘텐츠 최대 너비: 1152px
- 모바일 좌우 여백: 16px
- 데스크톱 좌우 여백: 32px
- breakpoint: `sm` 640px, `md` 768px, `lg` 1024px
