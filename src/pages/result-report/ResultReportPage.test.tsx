import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { ResultReportPage } from '@/pages/result-report/ResultReportPage'
import { formatDuration, mockResultReport } from '@/pages/result-report/model/resultReport'

function renderPage(path = '/result-reports/mock-report') {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[path]}>
      <ResultReportPage />
    </MemoryRouter>,
  )
}

describe('ResultReportPage', () => {
  it('학습 결과 요약과 문제별 오답 피드백을 렌더링한다', () => {
    const html = renderPage()

    expect(html).toContain('Spring @Transactional 심층 이해')
    expect(html).toContain('정답률 60%')
    expect(html).toContain('문제별 풀이 결과')
    expect(html).toContain('내가 제출한 답안')
    expect(html).toContain('다시 짚어볼 부분')
    expect(html).toContain('프록시를 거치지 않는다는 점')
    expect(html).toContain('학습 현황 보기')
    expect(html).not.toContain('correct_answer')
    expect(html).not.toContain('기준 답안')
    expect(html).not.toContain('source_excerpt')
  })

  it.each([
    ['loading', '결과 리포트를 불러오고 있습니다'],
    ['not-ready', '결과 리포트를 준비하고 있습니다'],
    ['not-found', '결과 리포트를 찾을 수 없습니다'],
    ['forbidden', '결과 리포트에 접근할 수 없습니다'],
  ])('%s Mock 상태를 렌더링한다', (state, copy) => {
    expect(renderPage(`/result-reports/mock-report?mock=${state}`)).toContain(copy)
  })

  it('알 수 없는 Mock 상태는 기본 결과 리포트로 처리한다', () => {
    const html = renderPage('/result-reports/mock-report?mock=unknown')

    expect(html).toContain('Spring @Transactional 심층 이해')
    expect(html).not.toContain('REPORT_NOT_FOUND')
    expect(html).not.toContain('FORBIDDEN')
  })
})

describe('result report model', () => {
  it('API 계약에 맞게 정답에는 피드백이 없고 오답에만 피드백이 있다', () => {
    expect(mockResultReport.results.filter((result) => result.isCorrect))
      .toEqual(expect.arrayContaining([expect.objectContaining({ aiFeedback: null })]))
    expect(mockResultReport.results.filter((result) => !result.isCorrect).every((result) => Boolean(result.aiFeedback)))
      .toBe(true)
  })

  it('풀이 시간을 분과 초로 표시한다', () => {
    expect(formatDuration(428)).toBe('7분 08초')
  })
})
