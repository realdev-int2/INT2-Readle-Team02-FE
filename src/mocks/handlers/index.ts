import { authHandlers } from '@/mocks/handlers/auth'
import { contentHandlers } from '@/mocks/handlers/content'
import { quizHandlers } from '@/mocks/handlers/quiz'

export const handlers = [...authHandlers, ...contentHandlers, ...quizHandlers]
