// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { useCreateContent } from '@/pages/home/api/useCreateContent'
import * as contentApi from '@/shared/api/content'
import { mockCreatedContent } from '@/mocks/fixtures/content'
import { ApiError } from '@/shared/api/error'
import React from 'react'

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

describe('useCreateContent', () => {
  afterEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  it('URL 모드로 콘텐츠 등록을 요청하면 성공 응답을 반환해야 한다', async () => {
    vi.mocked(contentApi.createContent).mockResolvedValueOnce({
      data: mockCreatedContent,
    })

    const { result } = renderHook(() => useCreateContent(), { wrapper })
    result.current.mutate({
      inputType: 'URL',
      title: '테스트 제목',
      url: 'https://example.com/test',
      extractedText: '테스트 본문 내용',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.data).toMatchObject({
      contentId: mockCreatedContent.contentId,
      validationStatus: 'PENDING',
    })
  })

  it('TEXT 모드로 콘텐츠 등록을 요청하면 성공 응답을 반환해야 한다', async () => {
    vi.mocked(contentApi.createContent).mockResolvedValueOnce({
      data: mockCreatedContent,
    })

    const { result } = renderHook(() => useCreateContent(), { wrapper })
    result.current.mutate({
      inputType: 'TEXT',
      title: '',
      text: '직접 입력한 테스트 본문 내용입니다.',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.data.validationStatus).toBe('PENDING')
  })

  it('입력값이 유효하지 않을 때 실패해야 한다', async () => {
    vi.mocked(contentApi.createContent).mockRejectedValueOnce(
      new ApiError({
        message: '입력값을 확인해 주세요.',
        status: 400,
        code: 'INVALID_INPUT'
      })
    )

    const { result } = renderHook(() => useCreateContent(), { wrapper })
    result.current.mutate({
      inputType: 'TEXT',
      title: '',
      text: '', // 본문이 비어있음
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toMatchObject({
      code: 'INVALID_INPUT',
      status: 400,
    })
  })

  it('요청 중에는 isPending 상태가 true로 유지되고 완료 후 false로 변경되어야 한다', async () => {
    let resolveCreate: (value: unknown) => void
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve
    })
    vi.mocked(contentApi.createContent).mockReturnValueOnce(createPromise as ReturnType<typeof contentApi.createContent>)

    const { result } = renderHook(() => useCreateContent(), { wrapper })
    
    expect(result.current.isPending).toBe(false)
    
    result.current.mutate({
      inputType: 'TEXT',
      text: '펜딩 상태 테스트 중입니다.',
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })

    resolveCreate!({ data: mockCreatedContent })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.isPending).toBe(false)
  })
})
