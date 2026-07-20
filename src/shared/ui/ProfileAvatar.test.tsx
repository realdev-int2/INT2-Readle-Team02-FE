// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import { ProfileAvatar } from '@/shared/ui/ProfileAvatar'

describe('ProfileAvatar', () => {
  it('hides a failed image while keeping the nickname initial fallback', () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    try {
      act(() => {
        root.render(<ProfileAvatar imageUrl="https://readle.local/profile.png" label="테스트 사용자 프로필" nickname="테스트 사용자" />)
      })

      const image = container.querySelector('img')
      expect(image).not.toBeNull()

      if (!image) {
        throw new Error('Expected profile image to render')
      }

      act(() => {
        image.dispatchEvent(new Event('error'))
      })

      expect(image.hidden).toBe(true)
      expect(container.textContent).toContain('테')
    } finally {
      act(() => {
        root.unmount()
      })
    }
  })
})
