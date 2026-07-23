import { apiRequest } from '@/shared/api/client'
import type { ResultReport } from '@/pages/result-report/model/resultReport'

export function getResultReportDetail(reportId: string) {
  return apiRequest<ResultReport>(`/result-reports/${reportId}`, {
    requiresAuth: true,
  })
}
