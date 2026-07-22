// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Routes, Route } from 'react-router'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HomePage } from '@/pages/home/HomePage'
import * as contentApi from '@/shared/api/content'
import { mockExtractedContent } from '@/mocks/fixtures/content'
import { ApiError } from '@/shared/api/error'

vi.mock('@/shared/api/content')

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('콘텐츠 입력의 핵심 UI를 렌더링한다', () => {
    const queryClient = createTestQueryClient()
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>
    )

    expect(html).toContain('새 학습 만들기')
    expect(html).not.toContain('오늘 읽은 기술 글을,')
    expect(html).toContain('URL 가져오기')
    expect(html).toContain('텍스트 직접 입력')
    expect(html).toContain('기술 아티클 URL')
    expect(html).toContain('본문 불러오기') // 버튼 텍스트가 mode에 따라 다름
    expect(html).not.toContain('READLE KNOWLEDGE COMPILER')
    expect(html).not.toContain('본문을 직접 붙여넣고 싶으신가요?')
    expect(html).not.toContain('/api/')
  })



  describe('URL 추출 동작 통합 테스트', () => {
    it('유효한 URL을 입력하고 제출하면 같은 탭에서 폼이 확장되고 내용이 주입된다', async () => {
      vi.mocked(contentApi.extractContent).mockResolvedValueOnce({
        ...mockExtractedContent,
      })
      const user = userEvent.setup()
      const queryClient = createTestQueryClient()

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <HomePage />
          </MemoryRouter>
        </QueryClientProvider>
      )

      // URL 입력란 찾기
      const urlInput = screen.getByLabelText('기술 아티클 URL')
      await user.type(urlInput, 'https://example.com/article')

      // 추출 요청
      const submitButton = screen.getByRole('button', { name: '본문 불러오기' })
      await user.click(submitButton)

      // 추출 성공 후 같은 탭(url)을 유지하면서 성공 메시지와 폼 렌더링 확인
      const successMessage = await screen.findByText(/성공적으로 불러왔습니다/)
      expect(successMessage).toBeInTheDocument()

      const urlTab = screen.getByRole('tab', { name: /URL 가져오기/ })
      expect(urlTab).toHaveAttribute('aria-selected', 'true')

      const nextButton = await screen.findByRole('button', { name: /분석하고 퀴즈 만들기/ })
      expect(nextButton).toBeInTheDocument()

      const titleInput = screen.getByLabelText('콘텐츠 제목')
      const contentTextarea = screen.getByLabelText('학습할 본문')

      expect(titleInput).toHaveValue(mockExtractedContent.title)
      expect(contentTextarea).toHaveValue(mockExtractedContent.content)
      expect(urlInput).toBeDisabled()

      // 다시 입력 버튼 동작 확인
      const resetButton = screen.getByRole('button', { name: '다시 입력' })
      await user.click(resetButton)

      expect(urlInput).not.toBeDisabled()
      expect(urlInput).toHaveValue('')
      expect(screen.queryByText(/성공적으로 불러왔습니다/)).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: '본문 불러오기' })).toBeInTheDocument()
    })

    it('유효하지 않은 URL 형식을 입력하면 에러 메시지를 표시한다', async () => {
      const user = userEvent.setup()
      const queryClient = createTestQueryClient()

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <HomePage />
          </MemoryRouter>
        </QueryClientProvider>
      )

      const urlInput = screen.getByLabelText('기술 아티클 URL')
      await user.type(urlInput, 'ftp://example.com/article')
      
      const submitButton = screen.getByRole('button', { name: '본문 불러오기' })
      await user.click(submitButton)

      const errorMessage = await screen.findByText(/http:\/\/ 또는 https:\/\/로 시작하는 올바른 URL을 입력해 주세요./)
      expect(errorMessage).toBeInTheDocument()
    })

    it('추출 실패 시 에러 메시지를 렌더링한다', async () => {
      vi.mocked(contentApi.extractContent).mockRejectedValueOnce(
        new ApiError({
          message: '본문을 자동으로 가져오지 못했습니다.',
          status: 422,
          code: 'EXTRACT_FAILED',
        })
      )
      const user = userEvent.setup()
      const queryClient = createTestQueryClient()

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <HomePage />
          </MemoryRouter>
        </QueryClientProvider>
      )

      const urlInput = screen.getByLabelText('기술 아티클 URL')
      await user.type(urlInput, 'https://example.com/extract-fail')

      const submitButton = screen.getByRole('button', { name: '본문 불러오기' })
      await user.click(submitButton)

      // 에러 메시지 렌더링 대기
      const errorMessage = await screen.findByText(/본문을 자동으로 가져오지 못했습니다/)
      expect(errorMessage).toBeInTheDocument()
    })
  })

  describe('콘텐츠 등록 동작 통합 테스트', () => {
    it('URL 모드로 성공적으로 콘텐츠를 등록하고 이동한다', async () => {
      vi.mocked(contentApi.extractContent).mockResolvedValueOnce({
        ...mockExtractedContent,
      })
      vi.mocked(contentApi.createContent).mockResolvedValueOnce({ contentId: 101, validationStatus: 'PENDING' })
      const user = userEvent.setup()
      const queryClient = createTestQueryClient()

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/contents/:contentId/preparing" element={<div data-testid="preparation-page">학습 준비 화면</div>} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      )

      // URL 모드로 가져오기
      const urlInput = screen.getByLabelText('기술 아티클 URL')
      await user.type(urlInput, 'https://example.com/article')
      const extractButton = screen.getByRole('button', { name: '본문 불러오기' })
      await user.click(extractButton)

      const createButton = await screen.findByRole('button', { name: /분석하고 퀴즈 만들기/ })
      expect(createButton).toBeInTheDocument()
      
      // 본문 길이를 300자 이상으로 맞춰 활성화 상태로 만듦
      const contentTextarea = screen.getByLabelText('학습할 본문')
      await user.clear(contentTextarea)
      contentTextarea.focus()
      await user.paste('a'.repeat(300))

      await user.click(createButton)

      // 등록 요청이 성공적으로 보내졌는지 확인
      expect(contentApi.createContent).toHaveBeenCalledWith(
        expect.objectContaining({
          inputType: 'URL',
          url: 'https://example.com/article',
        })
      )

      const preparationPage = await screen.findByTestId('preparation-page')
      expect(preparationPage).toBeInTheDocument()
    })

    it('TEXT 모드로 성공적으로 콘텐츠를 등록하고 이동한다', async () => {
      vi.mocked(contentApi.createContent).mockResolvedValueOnce({ contentId: 101, validationStatus: 'PENDING' })
      const user = userEvent.setup()
      const queryClient = createTestQueryClient()

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/contents/:contentId/preparing" element={<div data-testid="preparation-page">학습 준비 화면</div>} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      )

      // 텍스트 모드로 변경
      const textTab = screen.getByRole('tab', { name: /텍스트 직접 입력/ })
      await user.click(textTab)

      const contentTextarea = screen.getByLabelText('학습할 본문')
      contentTextarea.focus()
      await user.paste('a'.repeat(300))

      const createButton = screen.getByRole('button', { name: /분석하고 퀴즈 만들기/ })
      await user.click(createButton)

      expect(contentApi.createContent).toHaveBeenCalledWith(
        expect.objectContaining({
          inputType: 'TEXT',
          title: undefined,
          text: 'a'.repeat(300),
        })
      )

      const preparationPage = await screen.findByTestId('preparation-page')
      expect(preparationPage).toBeInTheDocument()
    })
  })
})
