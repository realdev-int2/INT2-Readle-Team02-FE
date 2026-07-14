import { http, HttpResponse } from 'msw'
import {
  MOCK_CONTENT_ID,
  mockCreatedContent,
  mockExtractedContent,
  mockValidationResponses,
} from '@/mocks/fixtures/content'
import type {
  ApiErrorBody,
  CreateContentRequest,
  ExtractContentRequest,
  ValidationStatus,
} from '@/shared/api'

const validationPollCounts = new Map<string, number>()
const validationScenarios = new Set<ValidationStatus>([
  'pending',
  'passed',
  'rejected',
  'failed',
])

function createErrorResponse(code: string, message: string): ApiErrorBody {
  return {
    error: {
      code,
      message,
      details: [],
    },
  }
}

function isValidUrl(value: string) {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

function resolveValidationScenario(request: Request, contentId: string) {
  const requestedScenario = new URL(request.url).searchParams.get('mockScenario')

  if (requestedScenario && validationScenarios.has(requestedScenario as ValidationStatus)) {
    return requestedScenario as ValidationStatus
  }

  const pollCount = (validationPollCounts.get(contentId) ?? 0) + 1
  validationPollCounts.set(contentId, pollCount)

  return pollCount < 3 ? 'pending' : 'passed'
}

export const contentHandlers = [
  http.post('*/api/contents/extract', async ({ request }) => {
    const body = (await request.json()) as ExtractContentRequest

    if (!isValidUrl(body.url)) {
      return HttpResponse.json(createErrorResponse('INVALID_URL', 'URL 형식을 확인해 주세요.'), {
        status: 400,
      })
    }

    if (body.url.includes('extract-fail')) {
      return HttpResponse.json(
        createErrorResponse(
          'EXTRACT_FAILED',
          '본문을 자동으로 가져오지 못했습니다. 본문을 직접 붙여넣어 주세요.',
        ),
        { status: 422 },
      )
    }

    return HttpResponse.json({
      data: {
        ...mockExtractedContent,
        sourceUrl: body.url,
      },
    })
  }),

  http.post('*/api/contents', async ({ request }) => {
    const body = (await request.json()) as CreateContentRequest

    if (!body.text.trim() || !body.title.trim()) {
      return HttpResponse.json(
        createErrorResponse('INVALID_INPUT', '제목과 본문을 확인해 주세요.'),
        { status: 400 },
      )
    }

    validationPollCounts.set(String(MOCK_CONTENT_ID), 0)

    return HttpResponse.json(
      {
        data: {
          ...mockCreatedContent,
          crawlStatus: body.inputType === 'url' ? 'success' : 'not_applicable',
          inputType: body.inputType,
        },
      },
      { status: 201 },
    )
  }),

  http.get('*/api/contents/:contentId/validation', ({ params, request }) => {
    const contentId = String(params.contentId)

    if (contentId !== String(MOCK_CONTENT_ID)) {
      return HttpResponse.json(
        createErrorResponse('CONTENT_NOT_FOUND', '콘텐츠를 찾을 수 없습니다.'),
        { status: 404 },
      )
    }

    const scenario = resolveValidationScenario(request, contentId)

    return HttpResponse.json({
      data: mockValidationResponses[scenario],
    })
  }),
]
