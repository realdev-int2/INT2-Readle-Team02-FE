import { useMutation, useQueryClient } from '@tanstack/react-query'
import { retryContentValidation } from '@/shared/api/content'
import type { ContentValidationResponse, ApiErrorBody } from '@/shared/api'

export function useRetryValidation(contentId: number) {
  const queryClient = useQueryClient()

  return useMutation<ContentValidationResponse, ApiErrorBody, void>({
    mutationFn: () => retryContentValidation(contentId),
    onSuccess: (data) => {
      // Race Condition 방지를 위해 즉시 PENDING 상태의 최신 데이터를 캐시에 덮어씀
      queryClient.setQueryData(['content-validation', contentId], data)
      
      // 이후 자연스럽게 다시 백그라운드 폴링(refetch)을 갱신하도록 invalidate
      return queryClient.invalidateQueries({
        queryKey: ['content-validation', contentId],
      })
    },
  })
}
