import { useQuery } from '@tanstack/react-query'
import { getContentValidation } from '@/shared/api/content'
import type { ContentValidationResponse } from '@/shared/api/types'
import type { ApiError } from '@/shared/api/error'

export function useValidationPolling(contentId: number) {
  return useQuery<ContentValidationResponse, ApiError>({
    queryKey: ['content-validation', contentId],
    queryFn: () => getContentValidation(contentId),
    enabled: contentId > 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      // status가 undefined(최초 요청 전)이거나 PENDING일 경우에만 3초 주기 폴링
      return status === 'PENDING' || status === undefined ? 3000 : false
    },
  })
}
