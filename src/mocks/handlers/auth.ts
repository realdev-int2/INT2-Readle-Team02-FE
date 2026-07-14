import { http, HttpResponse } from 'msw'
import { mockAuthSession, mockMember } from '@/mocks/fixtures/member'

export const authHandlers = [
  http.get('*/api/auth/session', () => {
    return HttpResponse.json({ data: mockAuthSession })
  }),

  http.get('*/api/users/me', () => {
    return HttpResponse.json({ data: mockMember })
  }),
]
