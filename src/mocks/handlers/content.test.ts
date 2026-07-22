import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { contentHandlers } from '@/mocks/handlers/content'

const server = setupServer(...contentHandlers)

describe('contentHandlers', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('유효한 URL에서 추출된 콘텐츠를 반환한다', async () => {
    const response = await fetch('http://localhost/api/contents/extract', {
      body: JSON.stringify({ url: 'https://example.com/article' }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      title: expect.any(String),
      content: expect.any(String),
    })
  })

  it('본문 추출 실패를 EXTRACT_FAILED로 반환한다', async () => {
    const response = await fetch('http://localhost/api/contents/extract', {
      body: JSON.stringify({ url: 'https://extract-fail.example.com/article' }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    const body = await response.json()

    expect(response.status).toBe(422)
    expect(body).toMatchObject({
      error: {
        code: 'EXTRACT_FAILED',
      },
    })
  })

  it('검증 실패 시나리오를 명시적으로 재현한다', async () => {
    const response = await fetch(
      'http://localhost/api/contents/101/validation?mockScenario=FAILED',
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      errorCode: 'AI_SERVICE_ERROR',
      status: 'FAILED',
    })
  })
})
