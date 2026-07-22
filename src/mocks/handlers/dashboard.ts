import { http, HttpResponse } from 'msw'
import { mockDashboard } from '@/mocks/fixtures/dashboard'

export const dashboardHandlers = [
  http.get('*/api/dashboard', () => HttpResponse.json(mockDashboard)),
]
