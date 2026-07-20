import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AuthContext } from '@/app/providers/AuthContext'
import type { Member } from '@/shared/api'
import { AppHeader } from '@/widgets/header/AppHeader'

function renderHeader(member: Member | null) {
  return renderToStaticMarkup(
    <AuthContext.Provider value={{ member, isLoading: false, invalidateAuth: () => {}, logout: async () => {} }}>
      <MemoryRouter>
        <AppHeader />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('AppHeader', () => {
  it('프로필 이미지 URL을 프로필 아바타에 전달한다', () => {
    const html = renderHeader({
      uuid: 'member-1',
      nickname: '테스트 사용자',
      profileImageUrl: 'https://readle.local/profile.png',
    })

    expect(html).toContain('aria-label="테스트 사용자 프로필"')
    expect(html).toContain('src="https://readle.local/profile.png"')
  })
})
