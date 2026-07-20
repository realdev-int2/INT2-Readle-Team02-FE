import { http, HttpResponse } from 'msw'
import { mockAuthSession, mockMember } from '@/mocks/fixtures/member'

export const authHandlers = [
  http.get('*/api/auth/session', () => {
    return HttpResponse.json(
      { data: mockAuthSession },
      { headers: { 'Set-Cookie': 'XSRF-TOKEN=mock-xsrf-token; Path=/' } },
    )
  }),

  http.post('*/api/auth/refresh', () => {
    return HttpResponse.json({ data: { accessToken: 'mock-access-token' } })
  }),

  http.get('*/api/users/me', () => {
    return HttpResponse.json({ data: mockMember })
  }),
]
