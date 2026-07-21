import { useMutation } from '@tanstack/react-query'
import { extractContent } from '@/shared/api/content'
import type { ExtractContentRequest, ExtractContentResponse } from '@/shared/api/types'
import type { ApiError } from '@/shared/api/error'

export function useExtractContent() {
  return useMutation<ExtractContentResponse, ApiError, ExtractContentRequest>({
    mutationFn: async (request) => {
      const response = await extractContent(request)
      return response.data
    },
  })
}
