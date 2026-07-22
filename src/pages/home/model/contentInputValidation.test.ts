import { describe, expect, it } from 'vitest'
import {
  initialContentInputValues,
  isValidLearningUrl,
  validateContentInput,
} from '@/pages/home/model/contentInputValidation'

describe('isValidLearningUrl', () => {
  it('HTTP와 HTTPS URL만 학습 URL로 허용한다', () => {
    expect(isValidLearningUrl('https://tech.example.com/article')).toBe(true)
    expect(isValidLearningUrl('http://localhost:3000/article')).toBe(true)
    expect(isValidLearningUrl('ftp://example.com/file')).toBe(false)
    expect(isValidLearningUrl('example.com/article')).toBe(false)
  })
})

describe('validateContentInput', () => {
  it('URL 모드일 때 URL 필수값과 형식을 검증한다', () => {
    expect(validateContentInput('URL', { ...initialContentInputValues, url: '' })).toEqual({
      url: '학습할 기술 아티클 URL을 입력해 주세요.',
    })
    expect(validateContentInput('URL', { ...initialContentInputValues, url: 'invalid' })).toEqual({
      url: 'http:// 또는 https://로 시작하는 올바른 URL을 입력해 주세요.',
    })
    expect(
      validateContentInput('URL', {
        ...initialContentInputValues,
        url: 'https://tech.example.com/article',
      }),
    ).toEqual({})
  })

  it('URL 모드이면서 추출 완료 상태(isExtracted)일 때 제목을 검증한다', () => {
    expect(
      validateContentInput(
        'URL',
        { ...initialContentInputValues, url: 'https://example.com', title: '' },
        true,
      ),
    ).toHaveProperty('title', '콘텐츠 제목을 입력해 주세요.')

    expect(
      validateContentInput(
        'URL',
        { ...initialContentInputValues, url: 'https://example.com', title: '제목', content: 'a'.repeat(300) },
        true,
      ),
    ).toEqual({})
  })

  it('TEXT 모드일 때 제목은 비워두어도 유효하다', () => {
    const errors = validateContentInput('TEXT', {
      ...initialContentInputValues,
      title: '',
      content: 'a'.repeat(300),
    })
    expect(errors.title).toBeUndefined()
  })

  describe('본문 길이 검증 (300자 ~ 15,000자)', () => {
    it('본문이 비어있으면 필수로 입력하도록 안내한다', () => {
      const errors = validateContentInput('TEXT', { ...initialContentInputValues, content: '   ' })
      expect(errors.content).toBe('학습할 기술 콘텐츠를 입력해 주세요.')
    })

    it('본문이 300자 미만이면 에러를 반환한다', () => {
      const errors = validateContentInput('TEXT', {
        ...initialContentInputValues,
        content: 'a'.repeat(299),
      })
      expect(errors.content).toBe('최소 300자 이상 입력해 주세요.')
    })

    it('본문이 300자 이상 15,000자 이하이면 에러가 없다', () => {
      const errors = validateContentInput('TEXT', {
        ...initialContentInputValues,
        content: 'a'.repeat(300),
      })
      expect(errors.content).toBeUndefined()

      const errorsMax = validateContentInput('TEXT', {
        ...initialContentInputValues,
        content: 'a'.repeat(15000),
      })
      expect(errorsMax.content).toBeUndefined()
    })

    it('본문이 15,000자를 초과하면 에러를 반환한다', () => {
      const errors = validateContentInput('TEXT', {
        ...initialContentInputValues,
        content: 'a'.repeat(15001),
      })
      expect(errors.content).toBe('최대 15,000자까지 입력 가능합니다.')
    })
  })
})
