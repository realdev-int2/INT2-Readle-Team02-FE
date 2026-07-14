import type {
  ContentValidationResponse,
  CreateContentResponse,
  ExtractContentResponse,
  ValidationStatus,
} from '@/shared/api'

export const MOCK_CONTENT_ID = 101

const REQUESTED_AT = '2026-07-14T10:00:00+09:00'
const VALIDATED_AT = '2026-07-14T10:00:03+09:00'

export const mockExtractedContent: ExtractContentResponse = {
  sourceUrl: 'https://example.com/spring-transaction',
  title: 'Spring Transaction 완전 정복',
  extractedText:
    'Spring의 @Transactional은 선언적 트랜잭션 관리의 핵심 기능입니다. 이 글에서는 트랜잭션 경계와 전파 속성을 설명합니다.',
  crawlStatus: 'success',
}

export const mockCreatedContent: CreateContentResponse = {
  contentId: MOCK_CONTENT_ID,
  inputType: 'url',
  crawlStatus: 'success',
  validation: {
    status: 'pending',
  },
  createdAt: REQUESTED_AT,
}

export const mockValidationResponses: Record<ValidationStatus, ContentValidationResponse> = {
  pending: {
    contentId: MOCK_CONTENT_ID,
    status: 'pending',
    requestedAt: REQUESTED_AT,
    validatedAt: null,
  },
  passed: {
    contentId: MOCK_CONTENT_ID,
    status: 'passed',
    requestedAt: REQUESTED_AT,
    validatedAt: VALIDATED_AT,
  },
  rejected: {
    contentId: MOCK_CONTENT_ID,
    status: 'rejected',
    bypassAvailable: false,
    reject_reason_code: 'NOT_DEVELOPMENT_RELATED',
    message: '개발/기술 학습 콘텐츠로 인식되지 않았습니다.',
    requestedAt: REQUESTED_AT,
    validatedAt: VALIDATED_AT,
  },
  failed: {
    contentId: MOCK_CONTENT_ID,
    status: 'failed',
    errorCode: 'AI_SERVICE_ERROR',
    message: '검증 처리 중 일시적인 문제가 발생했습니다. 다시 시도해 주세요.',
    requestedAt: REQUESTED_AT,
    validatedAt: VALIDATED_AT,
  },
}
