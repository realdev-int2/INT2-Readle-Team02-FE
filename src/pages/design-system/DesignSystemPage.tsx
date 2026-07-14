import type { ReactNode } from 'react'
import { Button, ErrorMessage, Input, Loading, PageContainer, Textarea } from '@/shared/ui'

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-card border border-border-glass bg-surface-glass p-5 shadow-card backdrop-blur-md transition-all duration-300 hover:border-border-glass-hover hover:shadow-card-hover sm:p-7">
      <div className="mb-5 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="h-6 w-1 rounded-full bg-linear-to-b from-brand-400 to-brand-600 shadow-accent"
        />
        <h2 className="text-section font-bold tracking-tight text-text-primary">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export function DesignSystemPage() {
  return (
    <main className="min-h-screen py-10 text-text-primary sm:py-14">
      <PageContainer className="grid gap-6">
        <header className="max-w-2xl">
          <p className="text-label font-semibold text-brand-400">Readle UI</p>
          <h1 className="mt-2 text-title font-bold tracking-tight">
            공통 컴포넌트 사용 예시
          </h1>
          <p className="mt-3 text-text-secondary">
            이 페이지는 개발 환경에서만 노출됩니다. Tab 키로 이동하며 focus, disabled,
            loading, error 상태를 확인하세요.
          </p>
        </header>

        <Section title="Button">
          <div className="flex flex-wrap items-center gap-3">
            <Button>기본 버튼</Button>
            <Button variant="secondary">보조 버튼</Button>
            <Button variant="ghost">고스트 버튼</Button>
            <Button variant="danger">삭제</Button>
            <Button disabled>비활성</Button>
            <Button loading>처리 중</Button>
          </div>
        </Section>

        <Section title="Input & Textarea">
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              description="콘텐츠를 구분할 수 있는 제목을 입력하세요."
              label="제목"
              placeholder="제목을 입력하세요"
              required
            />
            <Input
              defaultValue="잘못된 입력"
              error="제목은 2자 이상 입력해주세요."
              label="오류가 있는 입력"
            />
            <Input disabled label="비활성 입력" placeholder="수정할 수 없습니다" />
            <Textarea
              className="md:min-h-32"
              label="내용"
              placeholder="내용을 입력하세요"
              required
            />
          </div>
        </Section>

        <Section title="Feedback">
          <div className="grid gap-4">
            <Loading label="콘텐츠를 불러오는 중" />
            <ErrorMessage>요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.</ErrorMessage>
          </div>
        </Section>
      </PageContainer>
    </main>
  )
}
