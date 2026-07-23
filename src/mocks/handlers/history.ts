import { http, HttpResponse } from 'msw'
import { mockDashboard } from '@/mocks/fixtures/dashboard'
import type { HistoryResponse, HistorySort } from '@/pages/history/model/history'

const mockHistoryRecords = mockDashboard.recentRecords.map((record, index) => ({
  ...record,
  quizSetId: record.quizId,
  solveDurationSeconds: 95 + index * 47,
}))

export const historyHandlers = [
  http.get('*/api/result-reports', ({ request }) => {
    const url = new URL(request.url)
    const sort = (url.searchParams.get('sort') ?? 'latest') as HistorySort
    const tagId = Number(url.searchParams.get('tagId')) || undefined
    const content = mockHistoryRecords
      .filter((record) => !tagId || record.tags.some((tag) => tag.tagId === tagId))
      .toSorted((left, right) =>
        sort === 'latest'
          ? right.completedAt.localeCompare(left.completedAt)
          : left.completedAt.localeCompare(right.completedAt),
      )

    const response: HistoryResponse = {
      content,
      size: 10,
      nextCursor: null,
      hasNext: false,
    }

    return HttpResponse.json(response)
  }),
]
