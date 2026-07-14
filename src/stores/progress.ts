import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { SrsState } from '../lib/srs'
import { review } from '../lib/srs'

export interface SessionRecord {
  at: number
  role: string | null
  correct: number
  total: number
  xpGained: number
}

export interface ProgressState {
  schemaVersion: 1
  xp: number
  srs: Record<string, SrsState>
  sessions: SessionRecord[]
  answer: (questionId: string, correct: boolean, xpGained: number, now: number) => void
  recordSession: (record: SessionRecord) => void
  importState: (data: { xp: number; srs: Record<string, SrsState>; sessions: SessionRecord[] }) => void
  reset: () => void
}

export const PROGRESS_STORAGE_KEY = 'minibas-ref-quest/progress'

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      schemaVersion: 1,
      xp: 0,
      srs: {},
      sessions: [],
      answer: (questionId, correct, xpGained, now) =>
        set((state) => ({
          xp: state.xp + xpGained,
          srs: { ...state.srs, [questionId]: review(state.srs[questionId], correct, now) },
        })),
      recordSession: (record) =>
        set((state) => ({ sessions: [...state.sessions, record].slice(-200) })),
      importState: (data) =>
        set({ xp: data.xp ?? 0, srs: data.srs ?? {}, sessions: data.sessions ?? [] }),
      reset: () => set({ xp: 0, srs: {}, sessions: [] }),
    }),
    {
      name: PROGRESS_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        schemaVersion: s.schemaVersion,
        xp: s.xp,
        srs: s.srs,
        sessions: s.sessions,
      }),
      migrate: (persisted) => persisted as ProgressState,
    },
  ),
)
