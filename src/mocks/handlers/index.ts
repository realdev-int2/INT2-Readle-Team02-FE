import { authHandlers } from '@/mocks/handlers/auth'
import { contentHandlers } from '@/mocks/handlers/content'
import { dashboardHandlers } from '@/mocks/handlers/dashboard'
import { quizHandlers } from '@/mocks/handlers/quiz'
import { reportHandlers } from '@/mocks/handlers/report'

export const handlers = [...authHandlers, ...contentHandlers, ...dashboardHandlers, ...quizHandlers, ...reportHandlers]
