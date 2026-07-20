import type { AuthSession, Member } from '@/shared/api'

export const mockMember: Member = {
  uuid: '7d55e657-9a4e-4ff2-80e3-e5b7f8fffe12',
  nickname: 'Readle 개발자',
  profileImageUrl: 'https://readle.local/avatar.png',
}

export const mockAuthSession: AuthSession = {
  authenticated: true,
  uuid: mockMember.uuid,
}
