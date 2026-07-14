import type { Question } from './types'
import { toClockQuestions } from './questions/to-clock'
import { toScoresheetQuestions } from './questions/to-scoresheet'
import { toCasesQuestions } from './questions/to-cases'
import { toBasicsQuestions } from './questions/to-basics'
import { u12DiffQuestions } from './questions/u12-diff'

export * from './types'

export const allQuestions: Question[] = [
  ...toClockQuestions,
  ...toScoresheetQuestions,
  ...toCasesQuestions,
  ...toBasicsQuestions,
  ...u12DiffQuestions,
]
