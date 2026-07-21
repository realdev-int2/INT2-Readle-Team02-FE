import { useState, type FormEvent } from 'react'
import { generatePath, useNavigate } from 'react-router'
import {
  initialContentInputValues,
  validateContentInput,
  type ContentInputValues,
  type InputMode,
} from '@/pages/home/model/contentInputValidation'
import { ROUTES } from '@/shared/config/routes'
import { Button, ErrorMessage } from '@/shared/ui'
import { useExtractContent } from '@/pages/home/api/useExtractContent'
import '@/pages/home/HomePage.css'

export function HomePage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<InputMode>('url')
  const [values, setValues] = useState<ContentInputValues>(initialContentInputValues)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [extractError, setExtractError] = useState<string | null>(null)

  const extractContent = useExtractContent()

  const errors = validateContentInput(mode, values)
  const isValid = Object.keys(errors).length === 0

  function changeMode(nextMode: InputMode) {
    setMode(nextMode)
    setTouched({})
  }

  function updateValue(field: keyof ContentInputValues, value: string) {
    if (field === 'url') {
      setExtractError(null)
    }
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched(mode === 'url' ? { url: true } : { content: true, title: true })
    setExtractError(null)

    if (!isValid) {
      return
    }

    if (mode === 'url') {
      extractContent.mutate(
        { url: values.url },
        {
          onSuccess: (response) => {
            setValues((current) => ({
              ...current,
              title: response.title,
              content: response.extractedText,
            }))
            changeMode('text')
          },
          onError: (error) => {
            setExtractError(error.message || '본문을 자동으로 가져오지 못했습니다.')
          },
        },
      )
      return
    }

    void navigate(generatePath(ROUTES.learningPreparation, { contentId: 'mock-content' }))
  }

  return (
    <div className="learn-page py-6 sm:py-8 lg:py-10">
      <section className="mx-auto max-w-content" aria-labelledby="learn-page-title">
        <div className="mx-auto max-w-4xl py-8 sm:py-12">
          <p className="font-mono text-[0.625rem] font-bold tracking-[0.16em] text-brand-400">
            NEW LEARNING
          </p>
          <h1 className="mt-2 text-title font-bold text-text-primary sm:text-[2.25rem]" id="learn-page-title">
            새 학습 만들기
          </h1>
          <p className="mt-2 text-label text-text-muted">학습할 기술 콘텐츠의 입력 방식을 선택해 주세요.</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-caption font-semibold text-text-secondary">입력 방식</p>
              <div aria-label="콘텐츠 입력 방식" className="learn-method-tabs" role="tablist">
                <button
                  aria-controls="url-input-panel"
                  aria-selected={mode === 'url'}
                  className={`learn-method-tab ${mode === 'url' ? 'learn-method-tab-active' : ''}`}
                  id="url-input-tab"
                  onClick={() => changeMode('url')}
                  role="tab"
                  type="button"
                >
                  <span aria-hidden="true">↗</span> URL 가져오기
                </button>
                <button
                  aria-controls="text-input-panel"
                  aria-selected={mode === 'text'}
                  className={`learn-method-tab ${mode === 'text' ? 'learn-method-tab-active' : ''}`}
                  id="text-input-tab"
                  onClick={() => changeMode('text')}
                  role="tab"
                  type="button"
                >
                  <span aria-hidden="true">⌨</span> 텍스트 직접 입력
                </button>
              </div>
            </div>
            <p className="text-caption text-text-muted">
              {mode === 'url' ? '페이지 제목과 본문을 자동으로 가져옵니다.' : '제목과 본문을 직접 입력합니다.'}
            </p>
          </div>

          <form className="learn-composer mt-3" noValidate onSubmit={handleSubmit}>
            {mode === 'url' ? (
              <div aria-labelledby="url-input-tab" id="url-input-panel" role="tabpanel">
                <label className="sr-only" htmlFor="learning-url">기술 아티클 URL</label>
                <input
                  aria-describedby={touched.url && errors.url ? 'learning-url-error' : undefined}
                  aria-invalid={touched.url && errors.url ? true : undefined}
                  autoComplete="url"
                  className="learn-composer-input"
                  id="learning-url"
                  onBlur={() => setTouched((current) => ({ ...current, url: true }))}
                  onChange={(event) => updateValue('url', event.target.value)}
                  placeholder="학습할 기술 아티클 URL을 붙여넣어 주세요"
                  type="url"
                  value={values.url}
                />
                <ErrorMessage className="mt-2 px-2" id="learning-url-error">
                  {touched.url ? errors.url : undefined}
                  {!errors.url && extractError ? extractError : undefined}
                </ErrorMessage>
              </div>
            ) : (
              <div aria-labelledby="text-input-tab" id="text-input-panel" role="tabpanel">
                <label className="sr-only" htmlFor="learning-title">콘텐츠 제목</label>
                <input
                  aria-describedby={touched.title && errors.title ? 'learning-title-error' : undefined}
                  aria-invalid={touched.title && errors.title ? true : undefined}
                  className="learn-composer-title"
                  id="learning-title"
                  onBlur={() => setTouched((current) => ({ ...current, title: true }))}
                  onChange={(event) => updateValue('title', event.target.value)}
                  placeholder="콘텐츠 제목"
                  value={values.title}
                />
                <ErrorMessage className="mt-1 px-2" id="learning-title-error">
                  {touched.title ? errors.title : undefined}
                </ErrorMessage>
                <label className="sr-only" htmlFor="learning-content">학습할 본문</label>
                <textarea
                  aria-describedby={`content-character-count${touched.content && errors.content ? ' learning-content-error' : ''}`}
                  aria-invalid={touched.content && errors.content ? true : undefined}
                  className="learn-composer-textarea"
                  id="learning-content"
                  onBlur={() => setTouched((current) => ({ ...current, content: true }))}
                  onChange={(event) => updateValue('content', event.target.value)}
                  placeholder="학습하고 싶은 기술 콘텐츠를 붙여넣어 주세요"
                  value={values.content}
                />
                <ErrorMessage className="mt-1 px-2" id="learning-content-error">
                  {touched.content ? errors.content : undefined}
                </ErrorMessage>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3 border-t border-border-glass pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[0.6875rem] leading-5 text-text-muted">
                {mode === 'text' ? (
                  <><span className="font-mono" id="content-character-count">{values.content.length.toLocaleString('ko-KR')}자</span> 입력됨</>
                ) : (
                  '공개된 기술 문서와 블로그 URL을 사용할 수 있습니다.'
                )}
              </p>
              <Button 
                className="learn-submit-button" 
                disabled={!isValid || extractContent.isPending} 
                loading={extractContent.isPending}
                loadingLabel="불러오는 중"
                type="submit"
              >
                {mode === 'url' ? '본문 불러오기' : '분석하고 퀴즈 만들기'}
                <span aria-hidden="true">→</span>
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
