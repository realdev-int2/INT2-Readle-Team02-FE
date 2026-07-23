import { http, HttpResponse } from 'msw'
import { API_PREFIX } from '@/shared/api/client'
import { mockResultReport } from '@/pages/result-report/model/resultReport'

export const reportHandlers = [
  http.get(`${API_PREFIX}/result-reports/:reportId`, ({ params }) => {
    const reportId = params.reportId

    if (reportId === 'mock-report' || reportId === '701') {
      return HttpResponse.json(mockResultReport)
    }

    if (reportId === '404') {
      return HttpResponse.json({ message: '리포트를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (reportId === '403') {
      return HttpResponse.json({ message: '접근 권한이 없습니다.' }, { status: 403 })
    }

    // 기본적으로는 에러 응답을 내림 (준비되지 않은 상태 모사)
    return HttpResponse.json({ message: '아직 준비되지 않았습니다.' }, { status: 400 })
  }),
]
