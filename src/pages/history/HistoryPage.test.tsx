// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDashboard } from '@/pages/dashboard/api/useDashboard'
import { HistoryPage } from '@/pages/history/HistoryPage'
import { useHistory } from '@/pages/history/api/useHistory'

vi.mock('@/pages/dashboard/api/useDashboard')
vi.mock('@/pages/history/api/useHistory')

const historyRecord = {
  reportId: 701,
  quizSetId: 201,
  title: 'Spring 트랜잭션 학습',
  accuracyRate: 80,
  correctCount: 4,
  totalCount: 5,
  solveDurationSeconds: 125,
  completedAt: '2026-07-22T11:48:00',
  tags: [{ tagId: 801, name: 'spring' }],
}

function LocationProbe() {
  const location = useLocation()
  return <output aria-label="현재 주소">{`${location.pathname}${location.search}`}</output>
}

function renderPage(path = '/history') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <HistoryPage />
      <LocationProbe />
    </MemoryRouter>,
  )
}

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.mocked(useDashboard).mockReturnValue({
      data: {
        totals: {
          averageAccuracyRate: 80,
          completedQuizCount: 1,
          lastCompletedAt: historyRecord.completedAt,
          tagCount: 1,
          totalQuestionCount: 5,
        },
        recentRecords: [],
        tagSummaries: [
          { tagId: 801, name: 'spring', completedCount: 1, averageAccuracyRate: 80 },
        ],
      },
      isPending: false,
    } as never)
    vi.mocked(useHistory).mockReturnValue({
      data: {
        pages: [{
          content: [historyRecord],
          hasNext: false,
          nextCursor: null,
          size: 10,
        }],
        pageParams: [null],
      },
      hasNextPage: false,
      isError: false,
      isFetchNextPageError: false,
      isPending: false,
    } as never)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('실제 히스토리 응답을 렌더링하고 결과 리포트로 연결한다', () => {
    renderPage()

    expect(screen.getByText('Spring 트랜잭션 학습')).toBeInTheDocument()
    expect(screen.getByText('2분 5초')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Spring 트랜잭션 학습/ })).toHaveAttribute(
      'href',
      '/result-reports/701',
    )
    expect(screen.getByText('모든 학습 기록을 확인했습니다.')).toBeInTheDocument()
  })

  it('태그와 정렬 선택을 URL query 및 조회 조건에 반영한다', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: '#spring' }))
    expect(screen.getByLabelText('현재 주소')).toHaveTextContent('/history?tagId=801')
    expect(useHistory).toHaveBeenLastCalledWith('latest', 801)

    await user.selectOptions(screen.getByRole('combobox', { name: '정렬' }), 'oldest')
    expect(screen.getByLabelText('현재 주소')).toHaveTextContent(
      '/history?sort=oldest&tagId=801',
    )
    expect(useHistory).toHaveBeenLastCalledWith('oldest', 801)
  })

  it('선택한 태그의 기록이 없으면 전체 기록으로 돌아갈 수 있다', async () => {
    vi.mocked(useHistory).mockReturnValue({
      data: {
        pages: [{ content: [], hasNext: false, nextCursor: null, size: 10 }],
        pageParams: [null],
      },
      hasNextPage: false,
      isError: false,
      isFetchNextPageError: false,
      isPending: false,
    } as never)
    const user = userEvent.setup()
    renderPage('/history?tagId=801')

    expect(screen.getByText('선택한 태그의 학습 기록이 없습니다')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '전체 기록 보기' }))
    expect(screen.getByLabelText('현재 주소')).toHaveTextContent('/history')
  })

  it('다음 페이지 조회 실패 시 기존 기록을 유지하고 재시도할 수 있다', async () => {
    const fetchNextPage = vi.fn()
    vi.mocked(useHistory).mockReturnValue({
      data: {
        pages: [{
          content: [historyRecord],
          hasNext: true,
          nextCursor: '701',
          size: 10,
        }],
        pageParams: [null],
      },
      fetchNextPage,
      hasNextPage: true,
      isError: true,
      isFetchNextPageError: true,
      isPending: false,
    } as never)
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByText('Spring 트랜잭션 학습')).toBeInTheDocument()
    expect(screen.getByText('다음 학습 기록을 불러오지 못했습니다.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '다시 시도' }))
    expect(fetchNextPage).toHaveBeenCalledOnce()
  })
})
