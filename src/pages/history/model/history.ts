export type HistorySort = 'latest' | 'oldest'

export interface HistoryTag {
  name: string
  tagId: number
}

export interface HistoryRecord {
  accuracyRate: number
  completedAt: string
  correctCount: number
  quizSetId: number
  reportId: number
  solveDurationSeconds: number
  tags: HistoryTag[]
  title: string
  totalCount: number
}

export interface HistoryResponse {
  content: HistoryRecord[]
  hasNext: boolean
  nextCursor: string | null
  size: number
}

const ISO_OFFSET_PATTERN = /(Z|[+-]\d{2}:?\d{2})$/i

function parseHistoryTimestamp(value: string) {
  return new Date(ISO_OFFSET_PATTERN.test(value) ? value : `${value}+09:00`)
}

export function formatHistoryDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(parseHistoryTimestamp(value))
}

export function formatHistoryDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60

  if (minutes === 0) return `${remainder}초`
  if (remainder === 0) return `${minutes}분`
  return `${minutes}분 ${remainder}초`
}
