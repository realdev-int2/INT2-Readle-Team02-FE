import { apiRequest } from '@/shared/api/client'
import type {
  ContentValidationResponse,
  ContentCreateRequest,
  ContentCreateResponse,
  ContentExtractRequest,
  ContentExtractResponse,
} from '@/shared/api/types'

export function extractContent(request: ContentExtractRequest) {
  return apiRequest<ContentExtractResponse>('/contents/extract', {
    body: request,
    method: 'POST',
    requiresAuth: true,
  })
}

export function createContent(request: ContentCreateRequest) {
  return apiRequest<ContentCreateResponse>('/contents', {
    body: request,
    method: 'POST',
    requiresAuth: true,
  })
}

export function getContentValidation(contentId: number, signal?: AbortSignal) {
  return apiRequest<ContentValidationResponse>(
    `/contents/${contentId}/validation`,
    { requiresAuth: true, signal },
  )
}

export function retryContentValidation(contentId: number) {
  return apiRequest<ContentValidationResponse>(
    `/contents/${contentId}/validation/retry`,
    { method: 'POST', requiresAuth: true },
  )
}
