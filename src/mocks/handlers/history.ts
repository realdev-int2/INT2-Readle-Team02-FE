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
    const rawSort = url.searchParams.get('sort')
    const sort: HistorySort = rawSort === 'oldest' ? 'oldest' : 'latest'
    const tagId = Number(url.searchParams.get('tagId')) || undefined
    const cursor = url.searchParams.get('cursor')
    const requestedSize = Number(url.searchParams.get('size'))
    const size = Number.isInteger(requestedSize) && requestedSize > 0 ? requestedSize : 10
    const sortedRecords = mockHistoryRecords
      .filter((record) => !tagId || record.tags.some((tag) => tag.tagId === tagId))
      .toSorted((left, right) =>
        sort === 'latest'
          ? right.completedAt.localeCompare(left.completedAt)
          : left.completedAt.localeCompare(right.completedAt),
      )
    const cursorIndex = cursor
      ? sortedRecords.findIndex((record) => String(record.reportId) === cursor)
      : -1
    const startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0
    const content = sortedRecords.slice(startIndex, startIndex + size)
    const hasNext = startIndex + content.length < sortedRecords.length

    const response: HistoryResponse = {
      content,
      size,
      nextCursor: hasNext ? String(content.at(-1)?.reportId) : null,
      hasNext,
    }

    return HttpResponse.json(response)
  }),
]
