import { Route, Routes } from 'react-router'
import { AppLayout } from '@/app/layouts/AppLayout'
import { DesignSystemPage } from '@/pages/design-system/DesignSystemPage'
import { GradingPage } from '@/pages/grading/GradingPage'
import { HomePage } from '@/pages/home/HomePage'
import { LandingPage } from '@/pages/landing/LandingPage'
import { LearningPreparationPage } from '@/pages/learning-preparation/LearningPreparationPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { QuizPage } from '@/pages/quiz/QuizPage'
import { ResultReportPage } from '@/pages/result-report/ResultReportPage'
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
          element={<LearningPreparationPage />}
        />
        <Route
          path={ROUTES.quiz}
          element={<QuizPage />}
        />
        <Route
          path={ROUTES.grading}
          element={<GradingPage />}
        />
        <Route
          path={ROUTES.resultReport}
          element={<ResultReportPage />}
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
