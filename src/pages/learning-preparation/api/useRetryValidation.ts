import { useMutation, useQueryClient } from '@tanstack/react-query'
import { retryContentValidation } from '@/shared/api/content'
import type { ContentValidationResponse } from '@/shared/api'
import type { ApiError } from '@/shared/api/error'

export function useRetryValidation(contentId: number) {
  const queryClient = useQueryClient()

  return useMutation<ContentValidationResponse, ApiError, void>({
    onMutate: async () => {
      // 진행 중인 기존 폴링/요청을 취소하여 늦은 FAILED 응답이 캐시를 덮어쓰지 않도록 방어
      await queryClient.cancelQueries({ queryKey: ['content-validation', contentId] })
    },
    mutationFn: () => retryContentValidation(contentId),
    onSuccess: (data) => {
      // Race Condition 방지를 위해 즉시 PENDING 상태의 최신 데이터를 캐시에 덮어씀
      queryClient.setQueryData(['content-validation', contentId], data)
    },
  })
}
