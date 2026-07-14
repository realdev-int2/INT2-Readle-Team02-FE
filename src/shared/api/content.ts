import { apiRequest } from '@/shared/api/client'
import type {
  ApiResponse,
  ContentValidationResponse,
  CreateContentRequest,
  CreateContentResponse,
  ExtractContentRequest,
  ExtractContentResponse,
} from '@/shared/api/types'

export function extractContent(request: ExtractContentRequest) {
  return apiRequest<ApiResponse<ExtractContentResponse>>('/contents/extract', {
    body: request,
    method: 'POST',
  })
}

export function createContent(request: CreateContentRequest) {
  return apiRequest<ApiResponse<CreateContentResponse>>('/contents', {
    body: request,
    method: 'POST',
  })
}

export function getContentValidation(contentId: number) {
  return apiRequest<ApiResponse<ContentValidationResponse>>(
    `/contents/${contentId}/validation`,
  )
}
