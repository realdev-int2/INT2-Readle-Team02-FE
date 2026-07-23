export const ROUTES = {
  landing: '/',
  home: '/learn',
  login: '/login',
  contentPreview: '/contents/preview',
  learningPreparation: '/contents/:contentId/preparing',
  quiz: '/quizzes/:quizId',
  grading: '/result-reports/:reportId/preparing',
  resultReport: '/result-reports/:reportId',
  dashboard: '/dashboard',
  history: '/history',
  designSystem: '/design-system',
} as const
