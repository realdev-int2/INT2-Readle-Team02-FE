import { useMutation, useQueryClient } from '@tanstack/react-query'
import { retryContentValidation } from '@/shared/api/content'
import type { ContentValidationResponse } from '@/shared/api'
import type { ApiError } from '@/shared/api/error'

export function useRetryValidation(contentId: number) {
  const queryClient = useQueryClient()

  return useMutation<ContentValidationResponse, ApiError, void>({
    mutationFn: () => retryContentValidation(contentId),
    onSuccess: (data) => {
      // Race Condition 방지를 위해 즉시 PENDING 상태의 최신 데이터를 캐시에 덮어씀
      queryClient.setQueryData(['content-validation', contentId], data)
    },
  })
}
