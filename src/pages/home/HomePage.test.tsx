// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HomePage } from '@/pages/home/HomePage'
import {
  isValidLearningUrl,
  validateContentInput,
} from '@/pages/home/model/contentInputValidation'
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

  it('HTTP와 HTTPS URL만 학습 URL로 허용한다', () => {
    expect(isValidLearningUrl('https://tech.example.com/article')).toBe(true)
    expect(isValidLearningUrl('http://localhost:3000/article')).toBe(true)
    expect(isValidLearningUrl('ftp://example.com/file')).toBe(false)
    expect(isValidLearningUrl('example.com/article')).toBe(false)
  })

  it('URL 입력의 필수값과 형식을 검증한다', () => {
    expect(validateContentInput('url', { content: '', title: '', url: '' })).toEqual({
      url: '학습할 기술 아티클 URL을 입력해 주세요.',
    })
    expect(validateContentInput('url', { content: '', title: '', url: 'invalid' })).toEqual({
      url: 'http:// 또는 https://로 시작하는 올바른 URL을 입력해 주세요.',
    })
    expect(
      validateContentInput('url', {
        content: '',
        title: '',
        url: 'https://tech.example.com/article',
      }),
    ).toEqual({})

    // isExtracted === true일 때 제목과 본문 검증 추가
    expect(
      validateContentInput(
        'url',
        { content: '', title: '', url: 'https://tech.example.com/article' },
        true,
      ),
    ).toEqual({
      content: '학습할 기술 콘텐츠를 입력해 주세요.',
      title: '콘텐츠 제목을 입력해 주세요.',
    })
  })

  it('텍스트 입력에서 제목과 본문을 모두 요구한다', () => {
    expect(validateContentInput('text', { content: '', title: '', url: '' })).toEqual({
      content: '학습할 기술 콘텐츠를 입력해 주세요.',
      title: '콘텐츠 제목을 입력해 주세요.',
    })
    expect(
      validateContentInput('text', {
        content: '트랜잭션 전파 속성에 대한 본문',
        title: 'Spring Transaction',
        url: '',
      }),
    ).toEqual({})
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
})
