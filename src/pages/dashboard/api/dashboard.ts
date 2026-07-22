import { apiRequest } from '@/shared/api/client'
import type { DashboardData } from '@/pages/dashboard/model/dashboard'

export function fetchDashboard() {
  return apiRequest<DashboardData>('/dashboard', {
    requiresAuth: true,
  })
}
