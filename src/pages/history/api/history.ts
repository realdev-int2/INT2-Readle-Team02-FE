import { apiRequest } from '@/shared/api/client'
import type { HistoryResponse, HistorySort } from '@/pages/history/model/history'

export interface FetchHistoryParams {
  cursor?: string | null
  size?: number
  sort: HistorySort
  tagId?: number
}

export function fetchHistory({
  cursor,
  size = 10,
  sort,
  tagId,
}: FetchHistoryParams) {
  const query = new URLSearchParams({ size: String(size), sort })

  if (cursor) query.set('cursor', cursor)
  if (tagId) query.set('tagId', String(tagId))

  return apiRequest<HistoryResponse>(`/result-reports?${query.toString()}`, {
    requiresAuth: true,
  })
}
