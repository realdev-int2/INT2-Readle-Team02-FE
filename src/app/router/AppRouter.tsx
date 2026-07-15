import { Route, Routes } from 'react-router'
import { AppLayout } from '@/app/layouts/AppLayout'
import { DesignSystemPage } from '@/pages/design-system/DesignSystemPage'
import { HomePage } from '@/pages/home/HomePage'
import { LandingPage } from '@/pages/landing/LandingPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { RoutePlaceholderPage } from '@/pages/route-placeholder/RoutePlaceholderPage'
import { ROUTES } from '@/shared/config/routes'

export function AppRouter() {
  return (
    <Routes>
      {import.meta.env.DEV && (
        <Route path={ROUTES.designSystem} element={<DesignSystemPage />} />
      )}
      <Route path={ROUTES.landing} element={<LandingPage key="landing" />} />
      <Route path={ROUTES.login} element={<LandingPage initialLoginOpen key="login" />} />
      <Route element={<AppLayout />}>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route
          path={ROUTES.contentPreview}
          element={
            <RoutePlaceholderPage
              description="입력하거나 추출한 콘텐츠를 확인하고 수정하는 화면이 들어갈 자리입니다."
              eyebrow="Content"
              title="콘텐츠 확인 · 수정"
            />
          }
        />
        <Route
          path={ROUTES.learningPreparation}
          element={
            <RoutePlaceholderPage
              description="콘텐츠 검증과 퀴즈 생성 진행 상태를 안내하는 화면이 들어갈 자리입니다."
              eyebrow="Preparation"
              title="퀴즈 준비"
            />
          }
        />
        <Route
          path={ROUTES.quiz}
          element={
            <RoutePlaceholderPage
              description="생성된 문제를 순서대로 풀이하는 화면이 들어갈 자리입니다."
              eyebrow="Quiz"
              title="퀴즈 풀이"
            />
          }
        />
        <Route
          path={ROUTES.grading}
          element={
            <RoutePlaceholderPage
              description="제출한 답변의 채점 진행 상태를 안내하는 화면이 들어갈 자리입니다."
              eyebrow="Grading"
              title="답변 확인"
            />
          }
        />
        <Route
          path={ROUTES.resultReport}
          element={
            <RoutePlaceholderPage
              description="점수와 문제별 풀이 결과, 오답 피드백을 확인하는 화면이 들어갈 자리입니다."
              eyebrow="Result"
              title="결과 리포트"
            />
          }
        />
        <Route
          path={ROUTES.dashboard}
          element={
            <RoutePlaceholderPage
              description="태그를 기준으로 누적 학습 데이터를 확인하는 화면이 들어갈 자리입니다."
              eyebrow="Dashboard"
              title="학습 현황 대시보드"
            />
          }
        />
        <Route
          path={ROUTES.history}
          element={
            <RoutePlaceholderPage
              description="완료한 퀴즈와 과거 학습 기록을 확인하는 화면이 들어갈 자리입니다."
              eyebrow="History"
              title="학습 히스토리"
            />
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
