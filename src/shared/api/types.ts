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
  email: string | null
  nickname: string
  profileImageUrl: string | null
}

export interface AuthSession {
  authenticated: boolean
  user: Member | null
}

export type ContentInputType = 'url' | 'text'

export type CrawlStatus = 'not_applicable' | 'success' | 'failed'

export type ValidationStatus = 'pending' | 'passed' | 'rejected' | 'failed'

export type ValidationRejectReasonCode =
  | 'EMPTY_CONTENT'
  | 'CONTENT_TOO_SHORT'
  | 'BAD_WORD'
  | 'PROMPT_INJECTION_DETECTED'
  | 'NOT_DEVELOPMENT_RELATED'
  | 'LOW_CONFIDENCE'

export type ValidationErrorCode = 'AI_SERVICE_ERROR' | 'TIMEOUT' | 'UNKNOWN_ERROR'

export interface ExtractContentRequest {
  url: string
}

export interface ExtractContentResponse {
  sourceUrl: string
  extractedText: string
  title: string
  crawlStatus: Extract<CrawlStatus, 'success'>
}

export interface CreateContentRequest {
  inputType: ContentInputType
  sourceUrl?: string | null
  title: string
  text: string
}

export interface CreateContentResponse {
  contentId: number
  inputType: ContentInputType
  crawlStatus: CrawlStatus
  validation: {
    status: Extract<ValidationStatus, 'pending'>
  }
  createdAt: string
}

export interface ContentValidationResponse {
  contentId: number
  status: ValidationStatus
  bypassAvailable?: boolean
  reject_reason_code?: ValidationRejectReasonCode
  errorCode?: ValidationErrorCode
  message?: string
  requestedAt: string
  validatedAt: string | null
}
