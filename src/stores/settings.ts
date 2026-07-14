import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface SettingsState {
  /** 出題対象: u12モードではU12と共通問題、generalモードでは一般と共通問題 */
  ruleset: 'u12' | 'general'
  questionsPerSession: number
  setRuleset: (r: 'u12' | 'general') => void
  setQuestionsPerSession: (n: number) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ruleset: 'u12',
      questionsPerSession: 10,
      setRuleset: (ruleset) => set({ ruleset }),
      setQuestionsPerSession: (questionsPerSession) => set({ questionsPerSession }),
    }),
    {
      name: 'minibas-ref-quest/settings',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
