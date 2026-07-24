import { generatePath, Link, useSearchParams } from 'react-router'
import { useDashboard } from '@/pages/dashboard/api/useDashboard'
import { useHistory } from '@/pages/history/api/useHistory'
import {
  formatHistoryDate,
  formatHistoryDuration,
  type HistoryRecord,
  type HistorySort,
} from '@/pages/history/model/history'
import { ROUTES } from '@/shared/config/routes'
import { Button, ErrorMessage, Loading, PageHeading } from '@/shared/ui'
import '@/pages/history/HistoryPage.css'

function parseSort(value: string | null): HistorySort {
  return value === 'oldest' ? 'oldest' : 'latest'
}

function parseTagId(value: string | null) {
  if (!value) return undefined

  const tagId = Number(value)
  return Number.isInteger(tagId) && tagId > 0 ? tagId : undefined
}

function HistoryRecordCard({ record }: { record: HistoryRecord }) {
  return (
    <li>
      <Link
        className="history-record"
        to={generatePath(ROUTES.resultReport, { reportId: String(record.reportId) })}
      >
        <div className="history-record-main">
          <div className="history-record-meta">
            <time dateTime={record.completedAt}>{formatHistoryDate(record.completedAt)}</time>
            <span>{formatHistoryDuration(record.solveDurationSeconds)}</span>
          </div>
          <h2>{record.title}</h2>
          <div aria-label="학습 태그" className="history-record-tags">
            {record.tags.map((tag) => <span key={tag.tagId}>#{tag.name}</span>)}
          </div>
        </div>
        <div
          aria-label={`${record.totalCount}문제 중 ${record.correctCount}문제 정답`}
          className="history-record-score"
        >
          <strong>{record.correctCount}/{record.totalCount}</strong>
          <span>문제 정답</span>
        </div>
        <span aria-hidden="true" className="history-record-arrow">→</span>
      </Link>
    </li>
  )
}

export function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sort = parseSort(searchParams.get('sort'))
  const tagId = parseTagId(searchParams.get('tagId'))
  const historyQuery = useHistory(sort, tagId)
  const dashboardQuery = useDashboard()
  const records = historyQuery.data?.pages.flatMap((page) => page.content) ?? []
  const availableTags = dashboardQuery.data?.tagSummaries ?? []
  const selectedTag = availableTags.find((tag) => tag.tagId === tagId)

  function updateFilter(next: { sort?: HistorySort; tagId?: number }) {
    const params = new URLSearchParams()
    const nextSort = next.sort ?? sort
    const nextTagId = Object.hasOwn(next, 'tagId') ? next.tagId : tagId

    if (nextSort !== 'latest') params.set('sort', nextSort)
    if (nextTagId) params.set('tagId', String(nextTagId))
    setSearchParams(params)
  }

  return (
    <div className="history-page py-8 sm:py-12 lg:py-14">
      <PageHeading
        description="완료한 퀴즈와 문제별 학습 결과를 다시 확인해 보세요."
        eyebrow="LEARNING HISTORY"
        id="history-page-title"
        title="학습 히스토리"
      />

      <section aria-label="학습 기록 조회 조건" className="history-toolbar">
        <div className="history-filter-group">
          <span>기술 태그</span>
          <div className="history-filter-chips">
            <button
              aria-pressed={!tagId}
              className={!tagId ? 'is-active' : ''}
              onClick={() => updateFilter({ tagId: undefined })}
              type="button"
            >
              전체
            </button>
            {availableTags.map((tag) => (
              <button
                aria-pressed={tag.tagId === tagId}
                className={tag.tagId === tagId ? 'is-active' : ''}
                key={tag.tagId}
                onClick={() => updateFilter({ tagId: tag.tagId })}
                type="button"
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>
        <label className="history-sort">
          <span>정렬</span>
          <select
            onChange={(event) => updateFilter({ sort: event.target.value as HistorySort })}
            value={sort}
          >
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>
        </label>
      </section>

      {tagId && !dashboardQuery.isPending && (
        <p className="history-active-filter">
          {selectedTag ? `#${selectedTag.name}` : `태그 ID ${tagId}`} 학습 기록
        </p>
      )}

      {historyQuery.isPending ? (
        <section aria-live="polite" className="history-state">
          <Loading label="학습 기록을 불러오는 중" size="lg" />
          <h2>학습 기록을 불러오고 있습니다</h2>
        </section>
      ) : historyQuery.isError && records.length === 0 ? (
        <section className="history-state">
          <ErrorMessage>학습 기록을 불러오지 못했습니다.</ErrorMessage>
          <h2>히스토리를 확인할 수 없습니다</h2>
          <p>{historyQuery.error.message}</p>
          <Button onClick={() => void historyQuery.refetch()}>다시 시도</Button>
        </section>
      ) : records.length === 0 ? (
        <section className="history-state">
          <span aria-hidden="true" className="history-empty-mark">00</span>
          <h2>{tagId ? '선택한 태그의 학습 기록이 없습니다' : '아직 완료한 학습이 없습니다'}</h2>
          <p>{tagId ? '다른 태그를 선택하거나 전체 기록을 확인해 보세요.' : '퀴즈를 완료하면 학습 결과가 이곳에 쌓입니다.'}</p>
          {tagId
            ? <Button onClick={() => updateFilter({ tagId: undefined })}>전체 기록 보기</Button>
            : <Link className="history-start-link" to={ROUTES.home}>새 학습 시작하기</Link>}
        </section>
      ) : (
        <>
          <ul className="history-list">
            {records.map((record) => <HistoryRecordCard key={record.reportId} record={record} />)}
          </ul>
          <div className="history-pagination">
            {historyQuery.isFetchNextPageError ? (
              <>
                <ErrorMessage>다음 학습 기록을 불러오지 못했습니다.</ErrorMessage>
                <Button onClick={() => void historyQuery.fetchNextPage()}>다시 시도</Button>
              </>
            ) : historyQuery.hasNextPage ? (
              <Button
                disabled={historyQuery.isFetchingNextPage}
                onClick={() => void historyQuery.fetchNextPage()}
              >
                {historyQuery.isFetchingNextPage ? '불러오는 중...' : '기록 더 보기'}
              </Button>
            ) : <p>모든 학습 기록을 확인했습니다.</p>}
          </div>
        </>
      )}
    </div>
  )
}
