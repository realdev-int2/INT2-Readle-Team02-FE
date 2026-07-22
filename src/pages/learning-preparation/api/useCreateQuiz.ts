import { useMutation } from '@tanstack/react-query'
import { createQuiz } from '@/pages/quiz/api/quiz'
import type { QuizCreateRequest, QuizCreateResponse } from '@/pages/quiz/api/types'

import type { ApiError } from '@/shared/api/error'

export function useCreateQuiz() {
  return useMutation<QuizCreateResponse, ApiError, QuizCreateRequest>({
    mutationFn: async (request) => {
      const response = await createQuiz(request)
      return response
    },
  })
}
