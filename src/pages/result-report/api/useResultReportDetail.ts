import { useQuery } from '@tanstack/react-query'
import { getResultReportDetail } from '@/shared/api/report'
import type { ResultReport } from '@/pages/result-report/model/resultReport'
import type { ApiError } from '@/shared/api/error'

export function useResultReportDetail(reportId: string) {
  return useQuery<ResultReport, ApiError>({
    queryKey: ['result-report', reportId],
    queryFn: () => getResultReportDetail(reportId),
    enabled: Boolean(reportId),
    staleTime: 5 * 60 * 1000, // 5분
  })
}
