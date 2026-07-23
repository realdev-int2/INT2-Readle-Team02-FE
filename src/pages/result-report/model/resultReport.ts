import type { QuizQuestionType } from '@/pages/quiz/model/quiz'

export interface ResultReportTag {
  name: string
  tagId: number
}

export interface QuestionResult {
  aiFeedback: string | null
  isCorrect: boolean
  orderNo: number
  questionId: number
  questionText: string
  questionType: QuizQuestionType | string
  submittedAnswer: string
}

export interface ResultReport {
  accuracyRate: number
  attemptId: number
  completedAt: string
  correctCount: number
  solveDurationSeconds: number
  results: QuestionResult[]
  quizSetId: number
  tags: string[]
  title: string
  totalCount: number
}

export const mockResultReport: ResultReport = {
  quizSetId: 201,
  attemptId: 601,
  title: 'Spring @Transactional 심층 이해',
  accuracyRate: 60,
  correctCount: 3,
  totalCount: 5,
  solveDurationSeconds: 428,
  completedAt: '2026-07-16T02:48:00Z',
  tags: ['spring', 'transaction', 'jpa'],
  results: [
    {
      questionId: 301,
      orderNo: 1,
      questionType: 'multiple_choice',
      questionText: 'Spring의 @Transactional이 적용된 메서드에서 런타임 예외가 발생하면 기본적으로 어떤 동작을 하나요?',
      submittedAnswer: '트랜잭션을 롤백하고 예외를 다시 던진다.',
      isCorrect: true,
      aiFeedback: null,
    },
    {
      questionId: 302,
      orderNo: 2,
      questionType: 'short_answer',
      questionText: '같은 클래스 내부에서 @Transactional 메서드를 직접 호출할 때 트랜잭션이 적용되지 않을 수 있는 이유를 설명해 주세요.',
      submittedAnswer: '같은 객체 안에서 호출하면 새로운 트랜잭션이 만들어지지 않기 때문입니다.',
      isCorrect: false,
      aiFeedback: '핵심은 새로운 트랜잭션의 생성 여부가 아니라 프록시를 거치지 않는다는 점입니다. Spring AOP가 트랜잭션을 적용하는 호출 경로를 다시 확인해 보세요.',
    },
    {
      questionId: 303,
      orderNo: 3,
      questionType: 'multiple_choice',
      questionText: '기존 트랜잭션의 존재 여부와 관계없이 항상 새로운 트랜잭션을 시작하는 전파 속성은 무엇인가요?',
      submittedAnswer: 'REQUIRES_NEW',
      isCorrect: true,
      aiFeedback: null,
    },
    {
      questionId: 304,
      orderNo: 4,
      questionType: 'code_blank',
      questionText: '읽기 전용 트랜잭션으로 설정하려면 빈칸에 들어갈 속성을 입력해 주세요.',
      submittedAnswer: 'readonly',
      isCorrect: false,
      aiFeedback: '속성 이름은 대소문자를 구분합니다. Spring의 @Transactional에서 읽기 전용 여부를 지정하는 camelCase 속성명을 확인해 보세요.',
    },
    {
      questionId: 305,
      orderNo: 5,
      questionType: 'short_answer',
      questionText: '트랜잭션 경계를 서비스 계층에 두는 것이 일반적으로 적절한 이유를 한 문장으로 작성해 주세요.',
      submittedAnswer: '여러 저장소 작업을 하나의 비즈니스 작업 단위로 묶어 일관성을 보장하기 위해서입니다.',
      isCorrect: true,
      aiFeedback: null,
    },
  ],
}

export function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}분 ${String(seconds).padStart(2, '0')}초`
}

export function formatCompletedAt(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value))
}
