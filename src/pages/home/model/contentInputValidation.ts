export type InputMode = 'url' | 'text'

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
): ContentInputErrors {
  if (mode === 'url') {
    if (!values.url.trim()) {
      return { url: '학습할 기술 아티클 URL을 입력해 주세요.' }
    }

    if (!isValidLearningUrl(values.url.trim())) {
      return { url: 'http:// 또는 https://로 시작하는 올바른 URL을 입력해 주세요.' }
    }

    return {}
  }

  const errors: ContentInputErrors = {}

  if (!values.title.trim()) {
    errors.title = '콘텐츠 제목을 입력해 주세요.'
  }

  if (!values.content.trim()) {
    errors.content = '학습할 기술 콘텐츠를 입력해 주세요.'
  }

  return errors
}
