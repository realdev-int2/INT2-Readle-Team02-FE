import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchDashboard } from '@/pages/dashboard/api/dashboard'
import { apiRequest } from '@/shared/api/client'

vi.mock('@/shared/api/client')

describe('fetchDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('인증이 필요한 대시보드 API를 호출한다', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      recentRecords: [],
      tagSummaries: [],
      totals: {
        averageAccuracyRate: 0,
        completedQuizCount: 0,
        lastCompletedAt: null,
        tagCount: 0,
        totalQuestionCount: 0,
      },
    })

    await fetchDashboard()

    expect(apiRequest).toHaveBeenCalledWith('/dashboard', { requiresAuth: true })
  })
})
