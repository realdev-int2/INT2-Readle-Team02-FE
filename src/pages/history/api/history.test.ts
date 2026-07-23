import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchHistory } from '@/pages/history/api/history'
import { apiRequest } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  apiRequest: vi.fn(),
}))

describe('fetchHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('첫 페이지 조회 조건을 result-reports query로 전달한다', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      content: [],
      hasNext: false,
      nextCursor: null,
      size: 10,
    })

    await fetchHistory({ sort: 'latest', tagId: 801 })

    expect(apiRequest).toHaveBeenCalledWith(
      '/result-reports?size=10&sort=latest&tagId=801',
      { requiresAuth: true },
    )
  })

  it('다음 페이지 cursor와 정렬 조건을 함께 전달한다', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      content: [],
      hasNext: false,
      nextCursor: null,
      size: 20,
    })

    await fetchHistory({ cursor: 'next cursor', size: 20, sort: 'oldest' })

    expect(apiRequest).toHaveBeenCalledWith(
      '/result-reports?size=20&sort=oldest&cursor=next+cursor',
      { requiresAuth: true },
    )
  })

  it.each([1, 50])('허용 범위의 size=%d를 전달한다', async (size) => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      content: [],
      hasNext: false,
      nextCursor: null,
      size,
    })

    await fetchHistory({ size, sort: 'latest' })

    expect(apiRequest).toHaveBeenCalledWith(
      `/result-reports?size=${size}&sort=latest`,
      { requiresAuth: true },
    )
  })

  it.each([0, -1, 1.5, 51])('허용 범위를 벗어난 size=%s를 거부한다', (size) => {
    expect(() => fetchHistory({ size, sort: 'latest' })).toThrow(RangeError)
    expect(apiRequest).not.toHaveBeenCalled()
  })
})
