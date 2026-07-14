export const ROUTES = {
  landing: '/',
  home: '/learn',
  login: '/login',
  contentPreview: '/contents/preview',
  learningPreparation: '/contents/:contentId/preparing',
  quiz: '/quizzes/:quizId',
  grading: '/quiz-attempts/:attemptId/grading',
  resultReport: '/result-reports/:reportId',
  dashboard: '/dashboard',
  history: '/history',
  designSystem: '/design-system',
} as const
