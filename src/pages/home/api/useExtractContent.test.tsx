// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { useExtractContent } from '@/pages/home/api/useExtractContent'
import * as contentApi from '@/shared/api/content'
import { mockExtractedContent } from '@/mocks/fixtures/content'
import { ApiError } from '@/shared/api/error'

// API 함수를 모킹합니다.
vi.mock('@/shared/api/content')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useExtractContent', () => {
  afterEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  it('URL을 전달하면 추출된 콘텐츠 데이터를 반환해야 한다', async () => {
    vi.mocked(contentApi.extractContent).mockResolvedValueOnce({
      ...mockExtractedContent,
    })

    const { result } = renderHook(() => useExtractContent(), { wrapper })
    result.current.mutate({ url: 'https://example.com/article' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toMatchObject({
      content: mockExtractedContent.content,
      title: mockExtractedContent.title,
    })
  })

  it('유효하지 않은 URL 전달 시 실패해야 한다', async () => {
    vi.mocked(contentApi.extractContent).mockRejectedValueOnce(
      new ApiError({
        message: 'URL 형식을 확인해 주세요.',
        status: 400,
        code: 'INVALID_URL'
      })
    )

    const { result } = renderHook(() => useExtractContent(), { wrapper })
    result.current.mutate({ url: 'invalid-url' })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toMatchObject({
      code: 'INVALID_URL',
      status: 400,
    })
  })

  it('추출 실패를 재현하는 URL 전달 시 실패해야 한다', async () => {
    vi.mocked(contentApi.extractContent).mockRejectedValueOnce(
      new ApiError({
        message: '본문을 자동으로 가져오지 못했습니다.',
        status: 422,
        code: 'EXTRACT_FAILED'
      })
    )

    const { result } = renderHook(() => useExtractContent(), { wrapper })
    result.current.mutate({ url: 'https://example.com/extract-fail' })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toMatchObject({
      code: 'EXTRACT_FAILED',
      status: 422,
    })
  })
})
