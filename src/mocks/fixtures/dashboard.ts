import type { DashboardData } from '@/pages/dashboard/model/dashboard'

export const mockDashboard: DashboardData = {
  totals: {
    completedQuizCount: 12,
    totalQuestionCount: 58,
    tagCount: 5,
    averageAccuracyRate: 78.4,
    lastCompletedAt: '2026-07-22T11:48:00',
  },
  tagSummaries: [
    { tagId: 801, name: 'spring', completedCount: 4, averageAccuracyRate: 86 },
    { tagId: 802, name: 'transaction', completedCount: 3, averageAccuracyRate: 72 },
    { tagId: 803, name: 'jpa', completedCount: 2, averageAccuracyRate: 68 },
    { tagId: 804, name: 'kotlin', completedCount: 2, averageAccuracyRate: 91 },
    { tagId: 805, name: 'redis', completedCount: 1, averageAccuracyRate: 60 },
  ],
  recentRecords: [
    {
      reportId: 701,
      quizId: 201,
      title: 'Spring @Transactional 심층 이해',
      accuracyRate: 60,
      correctCount: 3,
      totalCount: 5,
      completedAt: '2026-07-22T11:48:00',
      tags: [
        { tagId: 801, name: 'spring' },
        { tagId: 802, name: 'transaction' },
      ],
    },
    {
      reportId: 702,
      quizId: 202,
      title: 'Kotlin Coroutines 완전 정복',
      accuracyRate: 100,
      correctCount: 5,
      totalCount: 5,
      completedAt: '2026-07-20T15:20:00',
      tags: [{ tagId: 804, name: 'kotlin' }],
    },
    {
      reportId: 703,
      quizId: 203,
      title: 'JPA 영속성 컨텍스트와 변경 감지',
      accuracyRate: 80,
      correctCount: 4,
      totalCount: 5,
      completedAt: '2026-07-18T09:35:00',
      tags: [{ tagId: 803, name: 'jpa' }],
    },
  ],
}
