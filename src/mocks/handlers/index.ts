import { authHandlers } from '@/mocks/handlers/auth'
import { contentHandlers } from '@/mocks/handlers/content'
import { dashboardHandlers } from '@/mocks/handlers/dashboard'
import { historyHandlers } from '@/mocks/handlers/history'
import { quizHandlers } from '@/mocks/handlers/quiz'

export const handlers = [
  ...authHandlers,
  ...contentHandlers,
  ...dashboardHandlers,
  ...historyHandlers,
  ...quizHandlers,
]
