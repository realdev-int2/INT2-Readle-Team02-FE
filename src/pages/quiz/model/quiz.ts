export type QuizQuestionType = 'multiple_choice' | 'short_answer' | 'code_blank'

export interface QuizChoice {
  choiceId: number
  choiceText: string
  orderNo: number
}

export interface QuizQuestionBase {
  orderNo: number
  questionId: number
  questionText: string
}

export interface QuizMultipleChoiceQuestion extends QuizQuestionBase {
  type: 'multiple_choice'
  choices: QuizChoice[]
}

export interface QuizShortAnswerQuestion extends QuizQuestionBase {
  type: 'short_answer'
}

export interface QuizCodeBlankQuestion extends QuizQuestionBase {
  type: 'code_blank'
  codeSnippet: string
}

export type QuizQuestion = QuizMultipleChoiceQuestion | QuizShortAnswerQuestion | QuizCodeBlankQuestion

export interface QuizFixture {
  questionCount: number
  questions: QuizQuestion[]
  quizId: number
  tags: string[]
  title: string
}

export type QuizAnswer = number | string
export type QuizAnswers = Record<number, QuizAnswer>

export const mockQuiz: QuizFixture = {
  quizId: 201,
  title: 'Spring @Transactional 심층 이해',
  questionCount: 5,
  tags: ['spring', 'transaction', 'jpa'],
  questions: [
    {
      questionId: 301,
      orderNo: 1,
      type: 'multiple_choice',
      questionText: 'Spring의 @Transactional이 적용된 메서드에서 런타임 예외가 발생하면 기본적으로 어떤 동작을 하나요?',
      choices: [
        { choiceId: 401, orderNo: 1, choiceText: '트랜잭션을 커밋하고 예외를 다시 던진다.' },
        { choiceId: 402, orderNo: 2, choiceText: '트랜잭션을 롤백하고 예외를 다시 던진다.' },
        { choiceId: 403, orderNo: 3, choiceText: '예외를 무시하고 메서드를 정상 종료한다.' },
        { choiceId: 404, orderNo: 4, choiceText: '새로운 트랜잭션을 시작해 작업을 재시도한다.' },
      ],
    },
    {
      questionId: 302,
      orderNo: 2,
      type: 'short_answer',
      questionText: '같은 클래스 내부에서 @Transactional 메서드를 직접 호출할 때 트랜잭션이 적용되지 않을 수 있는 이유를 설명해 주세요.',
    },
    {
      questionId: 303,
      orderNo: 3,
      type: 'multiple_choice',
      questionText: '기존 트랜잭션의 존재 여부와 관계없이 항상 새로운 트랜잭션을 시작하는 전파 속성은 무엇인가요?',
      choices: [
        { choiceId: 405, orderNo: 1, choiceText: 'REQUIRED' },
        { choiceId: 406, orderNo: 2, choiceText: 'SUPPORTS' },
        { choiceId: 407, orderNo: 3, choiceText: 'REQUIRES_NEW' },
        { choiceId: 408, orderNo: 4, choiceText: 'MANDATORY' },
      ],
    },
    {
      questionId: 304,
      orderNo: 4,
      type: 'code_blank',
      questionText: '읽기 전용 트랜잭션으로 설정하려면 빈칸에 들어갈 속성을 입력해 주세요.',
      codeSnippet: '@Transactional(________ = true)\npublic List<Article> findAll() {\n  return articleRepository.findAll();\n}',
    },
    {
      questionId: 305,
      orderNo: 5,
      type: 'short_answer',
      questionText: '트랜잭션 경계를 서비스 계층에 두는 것이 일반적으로 적절한 이유를 한 문장으로 작성해 주세요.',
    },
  ],
}

export const questionTypeLabel: Record<QuizQuestionType, string> = {
  multiple_choice: '객관식',
  short_answer: '주관식',
  code_blank: '코드 빈칸',
}

export function isAnswered(answer: QuizAnswer | undefined) {
  return typeof answer === 'number' || (typeof answer === 'string' && answer.trim().length > 0)
}

export function getAnsweredCount(questions: QuizQuestion[], answers: QuizAnswers) {
  return questions.filter((question) => isAnswered(answers[question.questionId])).length
}

export function getFirstUnansweredIndex(questions: QuizQuestion[], answers: QuizAnswers) {
  return questions.findIndex((question) => !isAnswered(answers[question.questionId]))
}
