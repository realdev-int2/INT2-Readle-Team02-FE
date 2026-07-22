export type InputMode = 'URL' | 'TEXT'

export interface ContentInputValues {
  content: string
  title: string
  url: string
}

interface ContentInputErrors {
  content?: string
  title?: string
  url?: string
}

export const initialContentInputValues: ContentInputValues = {
  content: '',
  title: '',
  url: '',
}

export function isValidLearningUrl(value: string) {
  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function validateContentInput(
  mode: InputMode,
  values: ContentInputValues,
  isExtracted = false,
): ContentInputErrors {
  const errors: ContentInputErrors = {}

  if (mode === 'URL') {
    if (!values.url.trim()) {
      errors.url = '학습할 기술 아티클 URL을 입력해 주세요.'
    } else if (!isValidLearningUrl(values.url.trim())) {
      errors.url = 'http:// 또는 https://로 시작하는 올바른 URL을 입력해 주세요.'
    }

    if (!isExtracted) {
      return errors
    }
    
    if (!values.title.trim()) {
      errors.title = '콘텐츠 제목을 입력해 주세요.'
    }
  }

  const contentLength = values.content.trim().length
  if (contentLength === 0) {
    errors.content = '학습할 기술 콘텐츠를 입력해 주세요.'
  } else if (contentLength < 300) {
    errors.content = '최소 300자 이상 입력해 주세요.'
  } else if (contentLength > 15000) {
    errors.content = '최대 15,000자까지 입력 가능합니다.'
  }

  return errors
}
