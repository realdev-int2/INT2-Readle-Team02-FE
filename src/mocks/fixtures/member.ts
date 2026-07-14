import type { AuthSession, Member } from '@/shared/api'

export const mockMember: Member = {
  uuid: '7d55e657-9a4e-4ff2-80e3-e5b7f8fffe12',
  email: 'readle@example.com',
  nickname: 'Readle 개발자',
  profileImageUrl: null,
}

export const mockAuthSession: AuthSession = {
  authenticated: true,
  user: mockMember,
}
