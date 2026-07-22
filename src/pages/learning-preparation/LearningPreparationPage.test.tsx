import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { LearningPreparationPage } from '@/pages/learning-preparation/LearningPreparationPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

describe('LearningPreparationPage', () => {
  it('긴 생성 과정을 확인할 수 있는 전용 페이지를 렌더링한다', () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LearningPreparationPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(html).toContain('READLE KNOWLEDGE COMPILER')
    expect(html).toContain('퀴즈를 만들고 있습니다')
    expect(html).toContain('콘텐츠 본문 확인')
    expect(html).toContain('학습 콘텐츠 검증')
    expect(html).toContain('지식 구조 연결')
    expect(html).toContain('맞춤형 퀴즈 생성')
    expect(html).toContain('KNOWLEDGE MAP')
    expect(html).toContain('입력 화면으로 돌아가기')
    expect(html).not.toContain('/api/')
  })
})
