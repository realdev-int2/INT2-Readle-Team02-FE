import type {
  ContentValidationResponse,
  ContentCreateResponse,
  ContentExtractResponse,
  ValidationStatus,
} from '@/shared/api'

export const MOCK_CONTENT_ID = 101

const REQUESTED_AT = '2026-07-14T10:00:00+09:00'
const VALIDATED_AT = '2026-07-14T10:00:03+09:00'

export const mockExtractedContent: ContentExtractResponse = {
  title: 'Spring Transaction 완전 정복',
  content:
    'Spring의 @Transactional은 선언적 트랜잭션 관리의 핵심 기능입니다. 이 글에서는 트랜잭션 경계와 전파 속성을 설명합니다.',
}

export const mockCreatedContent: ContentCreateResponse = {
  contentId: MOCK_CONTENT_ID,
  validationStatus: 'PENDING',
}

export const mockValidationResponses: Record<ValidationStatus, ContentValidationResponse> = {
  PENDING: {
    contentId: MOCK_CONTENT_ID,
    status: 'PENDING',
    errorCode: null,
    message: null,
    bypassAvailable: false,
    requestedAt: REQUESTED_AT,
    validatedAt: null,
  },
  PASSED: {
    contentId: MOCK_CONTENT_ID,
    status: 'PASSED',
    errorCode: null,
    message: null,
    bypassAvailable: false,
    requestedAt: REQUESTED_AT,
    validatedAt: VALIDATED_AT,
  },
  REJECTED: {
    contentId: MOCK_CONTENT_ID,
    status: 'REJECTED',
    errorCode: 'NOT_DEVELOPMENT_RELATED',
    message: '개발/기술 학습 콘텐츠로 인식되지 않았습니다. 관련된 콘텐츠를 등록해 주세요.',
    bypassAvailable: false,
    requestedAt: REQUESTED_AT,
    validatedAt: VALIDATED_AT,
  },
  FAILED: {
    contentId: MOCK_CONTENT_ID,
    status: 'FAILED',
    errorCode: 'AI_SERVICE_ERROR',
    message: 'AI 검증 서비스에 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    bypassAvailable: false,
    requestedAt: REQUESTED_AT,
    validatedAt: VALIDATED_AT,
  },
}

/** MSW 전용: REJECTED이지만 우회(Bypass) 퀴즈 생성이 허용된 시나리오. mockScenario=REJECTED_BYPASS 로 테스트 가능. */
export const mockRejectedBypassResponse: ContentValidationResponse = {
  contentId: MOCK_CONTENT_ID,
  status: 'REJECTED',
  errorCode: 'LOW_CONFIDENCE',
  message: '정확한 검증이 어렵습니다. 콘텐츠 내용을 다시 한번 확인해 주세요.',
  bypassAvailable: true,
  requestedAt: REQUESTED_AT,
  validatedAt: VALIDATED_AT,
}
