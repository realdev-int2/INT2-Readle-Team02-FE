// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import * as dashboardApi from '@/pages/dashboard/api/dashboard'
import {
  clampAccuracyRate,
  formatAccuracyRate,
  formatDashboardDate,
  formatLastCompletedAt,
  type DashboardData,
} from '@/pages/dashboard/model/dashboard'

vi.mock('@/pages/dashboard/api/dashboard')

const dashboardFixture: DashboardData = {
  totals: {
    completedQuizCount: 12,
    totalQuestionCount: 58,
    tagCount: 2,
    averageAccuracyRate: 78.4,
    lastCompletedAt: '2026-07-16T11:48:00',
  },
  tagSummaries: [
    { tagId: 801, name: 'spring', completedCount: 4, averageAccuracyRate: 86 },
    { tagId: 802, name: 'transaction', completedCount: 3, averageAccuracyRate: 72 },
  ],
  recentRecords: [
    {
      reportId: 701,
      quizId: 201,
      title: 'Spring @Transactional 심층 이해',
      accuracyRate: 60,
      correctCount: 3,
      totalCount: 5,
      completedAt: '2026-07-16T11:48:00',
      tags: [
        { tagId: 801, name: 'spring' },
        { tagId: 802, name: 'transaction' },
      ],
    },
    {
      reportId: 702,
      quizId: 202,
      title: 'JPA 영속성 컨텍스트 이해',
      accuracyRate: 80,
      correctCount: 4,
      totalCount: 5,
      completedAt: '2026-07-15T10:00:00',
      tags: [{ tagId: 801, name: 'spring' }],
    },
  ],
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
}

function renderPage() {
  const queryClient = createTestQueryClient()

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('실제 API 응답의 누적 통계와 최근 학습 기록을 렌더링한다', async () => {
    vi.mocked(dashboardApi.fetchDashboard).mockResolvedValueOnce(dashboardFixture)

    renderPage()

    expect(screen.getByText('학습 현황을 불러오고 있습니다')).toBeInTheDocument()
    expect(await screen.findAllByText('Spring @Transactional 심층 이해')).toHaveLength(2)
    expect(screen.getByText('78.4')).toBeInTheDocument()
    expect(screen.getAllByText('#spring')).toHaveLength(3)
    expect(
      screen.getByRole('img', { name: '최근 2회 정답률 추이: 80%, 60%' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Spring @Transactional 심층 이해/ })).toHaveAttribute(
      'href',
      '/result-reports/701',
    )
    expect(screen.getByRole('link', { name: '전체 보기' })).toHaveAttribute(
      'href',
      '/history',
    )
  })

  it('완료한 퀴즈가 없으면 빈 학습 상태를 표시한다', async () => {
    vi.mocked(dashboardApi.fetchDashboard).mockResolvedValueOnce({
      recentRecords: [],
      tagSummaries: [],
      totals: {
        averageAccuracyRate: 0,
        completedQuizCount: 0,
        lastCompletedAt: null,
        tagCount: 0,
        totalQuestionCount: 0,
      },
    })

    renderPage()

    expect(await screen.findByText('첫 학습 기록을 만들어 보세요')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '새 퀴즈 만들기' })).toHaveAttribute('href', '/learn')
  })

  it('조회 실패 후 다시 시도하면 대시보드를 복구한다', async () => {
    vi.mocked(dashboardApi.fetchDashboard)
      .mockRejectedValueOnce(new Error('대시보드 조회에 실패했습니다.'))
      .mockResolvedValueOnce(dashboardFixture)
    const user = userEvent.setup()

    renderPage()

    expect(await screen.findByText('대시보드 조회에 실패했습니다.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(await screen.findAllByText('Spring @Transactional 심층 이해')).toHaveLength(2)
    expect(dashboardApi.fetchDashboard).toHaveBeenCalledTimes(2)
  })
})

describe('dashboard model', () => {
  it('KST 정책으로 완료 일시를 표시하고 빈 최근 학습일을 처리한다', () => {
    expect(formatDashboardDate('2026-07-16T11:48:00')).toContain('7월')
    expect(formatLastCompletedAt(null)).toBe('학습 기록 없음')
  })

  it('정답률 표시값과 progress 범위를 안전하게 제한한다', () => {
    expect(formatAccuracyRate(78.44)).toBe('78.4')
    expect(clampAccuracyRate(-1)).toBe(0)
    expect(clampAccuracyRate(120)).toBe(100)
  })
})
