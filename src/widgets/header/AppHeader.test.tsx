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
  it('프로필 이미지 URL이 있으면 장식 이미지를 기존 fallback 위에 표시한다', () => {
    const html = renderHeader({
      uuid: 'member-1',
      nickname: '테스트 사용자',
      profileImageUrl: 'https://readle.local/profile.png',
    })

    expect(html).toContain('aria-label="테스트 사용자 프로필"')
    expect(html).toContain('>테')
    expect(html).toContain('alt=""')
    expect(html).toContain('src="https://readle.local/profile.png"')
  })

  it.each([null, '   '])('프로필 이미지 URL이 없으면 기존 fallback만 표시한다: %s', (profileImageUrl) => {
    const html = renderHeader({
      uuid: 'member-1',
      nickname: '테스트 사용자',
      profileImageUrl,
    })

    expect(html).toContain('aria-label="테스트 사용자 프로필"')
    expect(html).toContain('>테</span>')
    expect(html).not.toContain('src="https://readle.local/profile.png"')
  })
})
