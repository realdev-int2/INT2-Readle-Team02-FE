import { useMutation } from '@tanstack/react-query'
import { createContent } from '@/shared/api/content'
import type { ContentCreateRequest, ContentCreateResponse } from '@/shared/api/types'
import type { ApiError } from '@/shared/api/error'

export function useCreateContent() {
  return useMutation<ContentCreateResponse, ApiError, ContentCreateRequest>({
    mutationFn: async (request) => {
      const response = await createContent(request)
      return response
    },
  })
}
