import type { SyntheticEvent } from 'react'
import { useState, useRef } from 'react'
import { generatePath, useNavigate } from 'react-router'
import { ROUTES } from '@/shared/config/routes'
import {
  initialContentInputValues,
  validateContentInput,
  type ContentInputValues,
  type InputMode,
} from '@/pages/home/model/contentInputValidation'
import { useExtractContent } from '@/pages/home/api/useExtractContent'
import { useCreateContent } from '@/pages/home/api/useCreateContent'
import type { ContentCreateRequest } from '@/shared/api/types'

export function useContentForm() {
  const navigate = useNavigate()

  const extractContent = useExtractContent()
  const createContent = useCreateContent()

  const [mode, setMode] = useState<InputMode>('URL')
  const [urlValues, setUrlValues] = useState<ContentInputValues>(initialContentInputValues)
  const [textValues, setTextValues] = useState<ContentInputValues>(initialContentInputValues)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isExtracted, setIsExtracted] = useState(false)
  const modeRef = useRef<InputMode>(mode)
  const submitGenerationRef = useRef(0)

  const values = mode === 'URL' ? urlValues : textValues
  const errors = validateContentInput(mode, values, isExtracted)
  const isValid = Object.keys(errors).length === 0

  const extractErrorMsg = extractContent.error ? (extractContent.error.message || '본문을 자동으로 가져오지 못했습니다.') : null
  const createErrorMsg = createContent.error ? (createContent.error.message || '콘텐츠 등록에 실패했습니다.') : null

  function changeMode(nextMode: InputMode) {
    submitGenerationRef.current += 1
    setMode(nextMode)
    modeRef.current = nextMode
    setTouched({})
    createContent.reset()
    extractContent.reset()
  }

  function resetExtractState() {
    submitGenerationRef.current += 1
    setUrlValues((current) => ({
      ...initialContentInputValues,
      url: current.url
    }))
    setTouched({})
    setIsExtracted(false)
    extractContent.reset()
    createContent.reset()
  }

  function updateValue(field: keyof ContentInputValues, value: string) {
    if (mode === 'URL') {
      if (field === 'url') {
        extractContent.reset()
      }
      setUrlValues((current) => ({ ...current, [field]: value }))
    } else {
      setTextValues((current) => ({ ...current, [field]: value }))
    }
  }

  function handleBlur(field: keyof ContentInputValues) {
    setTouched((current) => ({ ...current, [field]: true }))
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched(
      mode === 'URL'
        ? isExtracted
          ? { content: true, title: true, url: true }
          : { url: true }
        : { content: true, title: true }
    )

    createContent.reset()

    if (!isValid) {
      return
    }

    const currentGeneration = ++submitGenerationRef.current

    if (mode === 'URL' && !isExtracted) {
      extractContent.mutate(
        { url: values.url },
        {
          onSuccess: (response) => {
            if (currentGeneration !== submitGenerationRef.current) return
            setUrlValues((current) => ({
              ...current,
              title: response.title,
              content: response.content,
            }))
            setIsExtracted(true)
          },
          onError: () => {
            if (currentGeneration !== submitGenerationRef.current) return
            setIsExtracted(false)
          },
        },
      )
      return
    }

    const payload: ContentCreateRequest =
      mode === 'URL'
        ? {
            inputType: 'URL',
            title: values.title || undefined,
            url: values.url,
            extractedText: values.content,
          }
        : {
            inputType: 'TEXT',
            title: values.title || undefined,
            text: values.content,
          }

    createContent.mutate(
      payload,
      {
        onSuccess: (response) => {
          if (currentGeneration !== submitGenerationRef.current) return
          if (response.validationStatus === 'PENDING') {
            void navigate(generatePath(ROUTES.learningPreparation, { contentId: String(response.contentId) }))
          } else {
            window.alert('입력하신 콘텐츠가 유효하지 않아 거부되었습니다. 내용을 다시 확인해 주세요.')
          }
        },
      }
    )
  }

  return {
    mode,
    values,
    touched,
    errors,
    isValid,
    isExtracted,
    isExtractPending: extractContent.isPending,
    isCreatePending: createContent.isPending,
    extractErrorMsg,
    createErrorMsg,
    changeMode,
    resetExtractState,
    updateValue,
    handleBlur,
    handleSubmit,
  }
}
