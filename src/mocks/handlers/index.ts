import { authHandlers } from '@/mocks/handlers/auth'
import { contentHandlers } from '@/mocks/handlers/content'

export const handlers = [...authHandlers, ...contentHandlers]
