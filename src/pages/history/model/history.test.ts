import { describe, expect, it } from 'vitest'
import { parseHistoryTimestamp } from '@/pages/history/model/history'

describe('parseHistoryTimestamp', () => {
  it('오프셋 없는 시각은 KST로 해석하고 기존 오프셋은 그대로 보존한다', () => {
    const kstTimestamp = parseHistoryTimestamp('2026-07-23T14:00:00').getTime()
    const utcTimestamp = parseHistoryTimestamp('2026-07-23T05:00:00Z').getTime()
    const explicitKstTimestamp = parseHistoryTimestamp('2026-07-23T14:00:00+09:00').getTime()

    expect(kstTimestamp).toBe(utcTimestamp)
    expect(kstTimestamp).toBe(explicitKstTimestamp)
  })
})
