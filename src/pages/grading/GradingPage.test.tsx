import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { GradingPage } from '@/pages/grading/GradingPage'

describe('GradingPage', () => {
  it('채점 진행 상태와 처리 단계를 렌더링한다', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <GradingPage />
      </MemoryRouter>,
    )

    expect(html).toContain('답안을 채점하고 있습니다')
    expect(html).toContain('채점 진행률')
    expect(html).toContain('객관식 채점')
    expect(html).toContain('주관식 AI 평가')
    expect(html).toContain('코드 답안 평가')
    expect(html).toContain('결과 리포트 준비')
    expect(html).not.toContain('/api/')
  })
})
