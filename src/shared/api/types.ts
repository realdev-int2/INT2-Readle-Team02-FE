export interface ApiResponse<T> {
  data: T
}

export interface ApiErrorDetail {
  field?: string
  value?: unknown
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details: ApiErrorDetail[]
  }
}

export interface Member {
  uuid: string
  nickname: string
  profileImageUrl: string | null
}

export interface AuthSession {
  authenticated: boolean
  uuid: string | null
}

export type ContentInputType = 'URL' | 'TEXT'


export type ValidationStatus = 'PENDING' | 'PASSED' | 'REJECTED' | 'FAILED'

export type ValidationRejectReasonCode =
  | 'EMPTY_CONTENT'
  | 'CONTENT_TOO_SHORT'
  | 'BAD_WORD'
  | 'PROMPT_INJECTION_DETECTED'
  | 'NOT_DEVELOPMENT_RELATED'
  | 'LOW_CONFIDENCE'

export type ValidationErrorCode = 'AI_SERVICE_ERROR' | 'TIMEOUT' | 'SCHEMA_INVALID' | 'UNKNOWN_ERROR'

export interface ContentExtractRequest {
  url: string
}

export interface ContentExtractResponse {
  content: string
  title: string
}

export type ContentCreateRequest =
  | {
      inputType: 'URL'
      title?: string
      url: string
      extractedText: string
    }
  | {
      inputType: 'TEXT'
      title?: string
      text: string
    }

export interface ContentCreateResponse {
  contentId: number
  validationStatus: ValidationStatus
}

export interface ContentValidationResponse {
  contentId: number
  status: ValidationStatus
  errorCode?: ValidationRejectReasonCode | ValidationErrorCode | null
  message?: string | null
  bypassAvailable?: boolean
  requestedAt: string
  validatedAt: string | null
}
