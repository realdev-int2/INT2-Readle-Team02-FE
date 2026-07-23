import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchHistory } from '@/pages/history/api/history'
import type { HistoryResponse, HistorySort } from '@/pages/history/model/history'
import type { ApiError } from '@/shared/api/error'

export function useHistory(sort: HistorySort, tagId?: number) {
  return useInfiniteQuery<HistoryResponse, ApiError>({
    queryKey: ['result-reports', { sort, tagId }],
    queryFn: ({ pageParam }) =>
      fetchHistory({
        cursor: typeof pageParam === 'string' ? pageParam : null,
        sort,
        tagId,
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext && lastPage.nextCursor ? lastPage.nextCursor : undefined,
  })
}
