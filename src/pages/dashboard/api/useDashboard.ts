import { useQuery } from '@tanstack/react-query'
import { fetchDashboard } from '@/pages/dashboard/api/dashboard'
import type { DashboardData } from '@/pages/dashboard/model/dashboard'
import type { ApiError } from '@/shared/api/error'

export const dashboardQueryKey = ['dashboard'] as const

export function useDashboard() {
  return useQuery<DashboardData, ApiError>({
    queryKey: dashboardQueryKey,
    queryFn: fetchDashboard,
  })
}
