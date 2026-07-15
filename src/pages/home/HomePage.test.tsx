import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { HomePage } from '@/pages/home/HomePage'
import {
  isValidLearningUrl,
  validateContentInput,
} from '@/pages/home/model/contentInputValidation'

describe('HomePage', () => {
  it('콘텐츠 입력의 핵심 UI를 렌더링한다', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(html).toContain('새 학습 만들기')
    expect(html).not.toContain('오늘 읽은 기술 글을,')
    expect(html).toContain('URL 가져오기')
    expect(html).toContain('텍스트 직접 입력')
    expect(html).toContain('기술 아티클 URL')
    expect(html).toContain('분석하고 퀴즈 만들기')
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
})
