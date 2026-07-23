import { apiRequest } from '@/shared/api/client'
import type { HistoryResponse, HistorySort } from '@/pages/history/model/history'

export interface FetchHistoryParams {
  cursor?: string | null
  size?: number
  sort: HistorySort
  tagId?: number
}

const MIN_HISTORY_SIZE = 1
const MAX_HISTORY_SIZE = 50

function validateHistorySize(size: number) {
  if (!Number.isInteger(size) || size < MIN_HISTORY_SIZE || size > MAX_HISTORY_SIZE) {
    throw new RangeError(
      `size는 ${MIN_HISTORY_SIZE} 이상 ${MAX_HISTORY_SIZE} 이하의 정수여야 합니다.`,
    )
  }
}

export function fetchHistory({
  cursor,
  size = 10,
  sort,
  tagId,
}: FetchHistoryParams) {
  validateHistorySize(size)

  const query = new URLSearchParams({ size: String(size), sort })

  if (cursor) query.set('cursor', cursor)
  if (tagId) query.set('tagId', String(tagId))

  return apiRequest<HistoryResponse>(`/result-reports?${query.toString()}`, {
    requiresAuth: true,
  })
}
