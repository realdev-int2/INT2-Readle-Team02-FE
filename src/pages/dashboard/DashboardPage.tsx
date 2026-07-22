import type { ReactNode } from 'react'
import { generatePath, Link } from 'react-router'
import { useDashboard } from '@/pages/dashboard/api/useDashboard'
import {
  clampAccuracyRate,
  formatAccuracyRate,
  formatDashboardDate,
  formatLastCompletedAt,
  isDashboardEmpty,
  type DashboardData,
  type DashboardRecentRecord,
} from '@/pages/dashboard/model/dashboard'
import { ROUTES } from '@/shared/config/routes'
import { Button, ErrorMessage, Loading, PageHeading } from '@/shared/ui'
import '@/pages/dashboard/DashboardPage.css'

function DashboardPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-page py-8 sm:py-12 lg:py-14">
      <PageHeading
        description="누적 학습 성과와 최근 정답률을 한눈에 확인해 보세요."
        eyebrow="LEARNING OVERVIEW"
        id="dashboard-page-title"
        title="학습 현황 대시보드"
      />
      {children}
    </div>
  )
}

function DashboardLoadingState() {
  return (
    <DashboardPageShell>
      <section aria-live="polite" className="dashboard-state-card">
        <Loading label="학습 현황을 불러오는 중" size="lg" />
        <h2>학습 현황을 불러오고 있습니다</h2>
        <p>최근 학습 기록과 태그별 결과를 정리하고 있습니다.</p>
      </section>
    </DashboardPageShell>
  )
}

function DashboardErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <DashboardPageShell>
      <section className="dashboard-state-card">
        <ErrorMessage>학습 현황을 불러오지 못했습니다.</ErrorMessage>
        <h2>대시보드를 확인할 수 없습니다</h2>
        <p>{message}</p>
        <div className="dashboard-state-actions">
          <Button onClick={onRetry}>다시 시도</Button>
          <Link className="dashboard-state-secondary" to={ROUTES.home}>새 학습으로 이동</Link>
        </div>
      </section>
    </DashboardPageShell>
  )
}

function DashboardEmptyState() {
  return (
    <DashboardPageShell>
      <section className="dashboard-state-card">
        <span aria-hidden="true" className="dashboard-empty-mark">01</span>
        <h2>첫 학습 기록을 만들어 보세요</h2>
        <p>콘텐츠를 입력해 퀴즈를 완료하면 태그별 학습 현황이 이곳에 쌓입니다.</p>
        <Link className="dashboard-state-link" to={ROUTES.home}>새 퀴즈 만들기</Link>
      </section>
    </DashboardPageShell>
  )
}

function AccuracyGauge({ value }: { value: number }) {
  const accuracy = clampAccuracyRate(value)
  const circumference = 2 * Math.PI * 52

  return (
    <div
      aria-label={`전체 평균 정답률 ${formatAccuracyRate(accuracy)}%`}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={accuracy}
      className="dashboard-gauge"
      role="progressbar"
    >
      <svg aria-hidden="true" viewBox="0 0 120 120">
        <circle className="dashboard-gauge-track" cx="60" cy="60" r="52" />
        <circle
          className="dashboard-gauge-value"
          cx="60"
          cy="60"
          r="52"
          strokeDasharray={`${(accuracy / 100) * circumference} ${circumference}`}
        />
      </svg>
      <div>
        <p>평균 정답률</p>
        <div><strong>{formatAccuracyRate(accuracy)}</strong><span>%</span></div>
      </div>
    </div>
  )
}

function RecentAccuracySparkline({ records }: { records: DashboardData['recentRecords'] }) {
  const chronologicalRates = [...records].reverse().map((record) => clampAccuracyRate(record.accuracyRate))
  const latestRecord = records[0]

  if (chronologicalRates.length < 2) {
    return <p className="dashboard-trend-empty">학습 기록이 더 쌓이면 최근 정답률 추이를 보여드려요.</p>
  }

  const width = 260
  const height = 72
  const padding = 5
  const points = chronologicalRates.map((rate, index) => ({
    x: padding + (index * (width - padding * 2)) / (chronologicalRates.length - 1),
    y: padding + ((100 - rate) * (height - padding * 2)) / 100,
  }))
  const pointText = points.map(({ x, y }) => `${x},${y}`).join(' ')

  return (
    <div className="dashboard-trend">
      <div className="dashboard-trend-heading">
        <div><span>정답률 변화</span><small>최근 {chronologicalRates.length}회 · 오래된 순</small></div>
        <div><small>최근 결과</small><strong>{latestRecord.correctCount}/{latestRecord.totalCount}</strong></div>
      </div>
      <svg
        aria-label={`최근 ${chronologicalRates.length}회 정답률 추이: ${chronologicalRates.join('%, ')}%`}
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <linearGradient id="dashboard-trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(76 131 255)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(76 131 255)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon className="dashboard-trend-area" points={`${padding},${height - padding} ${pointText} ${width - padding},${height - padding}`} />
        <polyline className="dashboard-trend-line" points={pointText} />
        {points.map(({ x, y }, index) => <circle cx={x} cy={y} key={`${x}-${y}`} r={index === points.length - 1 ? 3.5 : 2} />)}
      </svg>
    </div>
  )
}

function SummaryMetric({ label, unit, value }: { label: string; unit: string; value: number }) {
  return (
    <div className="dashboard-summary-metric">
      <span>{label}</span>
      <div><strong>{value}</strong><small>{unit}</small></div>
    </div>
  )
}

function LatestLearningCard({ record }: { record?: DashboardRecentRecord }) {
  return (
    <article className="dashboard-latest-card">
      <div className="dashboard-card-heading">
        <div><span className="dashboard-section-label">LATEST</span><h2>최근 학습</h2></div>
        {record && <time dateTime={record.completedAt}>{formatLastCompletedAt(record.completedAt)}</time>}
      </div>
      {record ? (
        <>
          <div className="dashboard-latest-score"><strong>{record.correctCount}/{record.totalCount}</strong><span>문제 정답</span></div>
          <div className="dashboard-latest-content">
            <time dateTime={record.completedAt}>{formatDashboardDate(record.completedAt)}</time>
            <h3>{record.title}</h3>
            <div aria-label="최근 학습 태그" className="dashboard-chip-list">
              {record.tags.map((tag) => <span key={tag.tagId}>#{tag.name}</span>)}
            </div>
          </div>
          <Link className="dashboard-latest-link" to={generatePath(ROUTES.resultReport, { reportId: String(record.reportId) })}>
            결과 리포트 보기 <span aria-hidden="true">→</span>
          </Link>
        </>
      ) : <p className="dashboard-panel-empty">최근 학습 기록이 없습니다.</p>}
    </article>
  )
}

function DashboardContent({ dashboard }: { dashboard: DashboardData }) {
  const { recentRecords, tagSummaries, totals } = dashboard

  return (
    <DashboardPageShell>
      <section aria-label="학습 성과 요약" className="dashboard-overview-grid">
        <article className="dashboard-performance-card">
          <div className="dashboard-card-heading">
            <div>
              <span className="dashboard-section-label">PERFORMANCE</span>
              <h2>전체 학습 성과</h2>
            </div>
          </div>

          <div className="dashboard-performance-main">
            <AccuracyGauge value={totals.averageAccuracyRate} />
            <RecentAccuracySparkline records={recentRecords} />
          </div>
          <div className="dashboard-summary-metrics">
            <SummaryMetric label="완료한 퀴즈" unit="개" value={totals.completedQuizCount} />
            <SummaryMetric label="누적 문제" unit="문제" value={totals.totalQuestionCount} />
            <SummaryMetric label="학습한 태그" unit="개" value={totals.tagCount} />
          </div>
        </article>
        <LatestLearningCard record={recentRecords[0]} />
      </section>

      <section aria-label="학습 상세 현황" className="dashboard-detail-grid">
        <article className="dashboard-panel dashboard-tag-panel">
          <div className="dashboard-card-heading dashboard-panel-heading">
            <div><span className="dashboard-section-label">TOPICS</span><h2>태그별 학습 성과</h2></div>
            <span>{tagSummaries.length}개 태그</span>
          </div>
          {tagSummaries.length > 0 ? (
            <ol className="dashboard-tag-ranking">
              {tagSummaries.map((tag, index) => (
                <li key={tag.tagId}>
                  <span className="dashboard-tag-rank">{String(index + 1).padStart(2, '0')}</span>
                  <div className="dashboard-tag-info">
                    <strong>#{tag.name}</strong>
                    <span>{tag.completedCount}회 학습</span>
                  </div>
                </li>
              ))}
            </ol>
          ) : <p className="dashboard-panel-empty">아직 집계된 학습 태그가 없습니다.</p>}
        </article>

        <article className="dashboard-panel dashboard-activity-panel">
          <div className="dashboard-card-heading dashboard-panel-heading">
            <div>
              <span className="dashboard-section-label">ACTIVITY</span>
              <h2>최근 학습 기록</h2>
            </div>
            <Link to={ROUTES.history}>전체 보기</Link>
          </div>

          {recentRecords.length > 0 ? (
            <ul className="dashboard-activity-list">
              {recentRecords.map((record) => (
                <li key={record.reportId}>
                  <Link to={generatePath(ROUTES.resultReport, { reportId: String(record.reportId) })}>
                    <div className="dashboard-activity-marker" />
                    <div className="dashboard-activity-content">
                      <time dateTime={record.completedAt}>{formatDashboardDate(record.completedAt)}</time>
                      <strong>{record.title}</strong>
                      <span>{record.tags.map((tag) => `#${tag.name}`).join(' ')}</span>
                    </div>
                    <div className="dashboard-activity-score">
                      <strong>{record.correctCount}/{record.totalCount}</strong>
                      <span>정답</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dashboard-panel-empty">최근 학습 기록이 없습니다.</p>
          )}
        </article>
      </section>
    </DashboardPageShell>
  )
}

export function DashboardPage() {
  const dashboardQuery = useDashboard()

  if (dashboardQuery.isPending) return <DashboardLoadingState />
  if (dashboardQuery.isError) {
    return (
      <DashboardErrorState
        message={dashboardQuery.error.message}
        onRetry={() => void dashboardQuery.refetch()}
      />
    )
  }
  if (isDashboardEmpty(dashboardQuery.data)) return <DashboardEmptyState />

  return <DashboardContent dashboard={dashboardQuery.data} />
}
