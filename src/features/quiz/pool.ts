import { allQuestions, type Question } from '../../../content'

/** 設定のルールセットに応じた出題プール（both は常に含む） */
export function questionPool(ruleset: 'u12' | 'general'): Question[] {
  return allQuestions.filter((q) => q.ruleset === 'both' || q.ruleset === ruleset)
}

export const ROLE_ICONS: Record<string, string> = {
  scorer: '✏️',
  'a-scorer': '🖥️',
  timer: '⏱️',
  'sc-operator': '🔄',
  'to-supporter': '🤝',
}
