export interface DashboardTag {
  name: string
  tagId: number
}

export interface DashboardRecentRecord {
  accuracyRate: number
  completedAt: string
  correctCount: number
  quizId: number
  reportId: number
  tags: DashboardTag[]
  title: string
  totalCount: number
}

export interface DashboardTagSummary extends DashboardTag {
  averageAccuracyRate: number
  completedCount: number
}

export interface DashboardTotals {
  averageAccuracyRate: number
  completedQuizCount: number
  lastCompletedAt: string | null
  tagCount: number
  totalQuestionCount: number
}

export interface DashboardData {
  recentRecords: DashboardRecentRecord[]
  tagSummaries: DashboardTagSummary[]
  totals: DashboardTotals
}

const ISO_OFFSET_PATTERN = /(Z|[+-]\d{2}:?\d{2})$/i

function parseDashboardTimestamp(value: string) {
  const timestamp = ISO_OFFSET_PATTERN.test(value) ? value : `${value}+09:00`

  return new Date(timestamp)
}

export function formatDashboardDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(parseDashboardTimestamp(value))
}

export function formatLastCompletedAt(value: string | null) {
  if (!value) return '학습 기록 없음'

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(parseDashboardTimestamp(value))
}

export function formatAccuracyRate(value: number) {
  return new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: 1,
  }).format(value)
}

export function clampAccuracyRate(value: number) {
  return Math.min(100, Math.max(0, value))
}

export function isDashboardEmpty(dashboard: DashboardData) {
  return dashboard.totals.completedQuizCount === 0
}
