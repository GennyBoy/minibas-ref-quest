import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { SrsState } from '../lib/srs'
import { review } from '../lib/srs'
import type { DrillBest, DrillScore } from '../lib/drill'
import { isNewBest } from '../lib/drill'
import type { SimSummary } from '../lib/sim'
import { isNewSimBest } from '../lib/sim'

export interface SessionRecord {
  at: number
  role: string | null
  correct: number
  total: number
  xpGained: number
  /** 未指定はクイズ（v1からのデータ互換のため optional） */
  kind?: 'quiz' | 'drill' | 'sim'
  /** ドリルID（kind: sim のときは台本ID） */
  drillId?: string
}

export interface ProgressImport {
  xp: number
  srs: Record<string, SrsState>
  sessions: SessionRecord[]
  drillBest?: Record<string, DrillBest>
}

export interface ProgressState {
  schemaVersion: 2
  xp: number
  srs: Record<string, SrsState>
  sessions: SessionRecord[]
  /** ドリル自己ベスト。キーは drillBestKey()（例: 'shotclock/u12'） */
  drillBest: Record<string, DrillBest>
  answer: (questionId: string, correct: boolean, xpGained: number, now: number) => void
  recordSession: (record: SessionRecord) => void
  recordDrill: (
    key: string,
    drillId: string,
    role: string | null,
    result: DrillScore,
    xpGained: number,
    at: number,
  ) => void
  recordSim: (
    key: string,
    scriptId: string,
    role: string | null,
    result: SimSummary,
    xpGained: number,
    at: number,
  ) => void
  importState: (data: ProgressImport) => void
  reset: () => void
}

export const PROGRESS_STORAGE_KEY = 'minibas-ref-quest/progress'

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      schemaVersion: 2,
      xp: 0,
      srs: {},
      sessions: [],
      drillBest: {},
      answer: (questionId, correct, xpGained, now) =>
        set((state) => ({
          xp: state.xp + xpGained,
          srs: { ...state.srs, [questionId]: review(state.srs[questionId], correct, now) },
        })),
      recordSession: (record) =>
        set((state) => ({ sessions: [...state.sessions, record].slice(-200) })),
      recordDrill: (key, drillId, role, result, xpGained, at) =>
        set((state) => {
          const prev = state.drillBest[key]
          const drillBest = isNewBest(prev, result)
            ? {
                ...state.drillBest,
                [key]: {
                  score: result.score,
                  bestStreak: result.bestStreak,
                  avgReactionMs: result.avgReactionMs,
                  at,
                },
              }
            : state.drillBest
          return {
            xp: state.xp + xpGained,
            drillBest,
            sessions: [
              ...state.sessions,
              {
                at,
                role,
                correct: result.correct,
                total: result.total,
                xpGained,
                kind: 'drill' as const,
                drillId,
              },
            ].slice(-200),
          }
        }),
      recordSim: (key, scriptId, role, result, xpGained, at) =>
        set((state) => {
          const prev = state.drillBest[key]
          // 自己ベストは drillBest に相乗り（時間要素がないので avgReactionMs は null）
          const drillBest = isNewSimBest(prev, result)
            ? {
                ...state.drillBest,
                [key]: {
                  score: result.score,
                  bestStreak: result.bestStreak,
                  avgReactionMs: null,
                  at,
                },
              }
            : state.drillBest
          return {
            xp: state.xp + xpGained,
            drillBest,
            sessions: [
              ...state.sessions,
              {
                at,
                role,
                correct: result.correct,
                total: result.total,
                xpGained,
                kind: 'sim' as const,
                drillId: scriptId,
              },
            ].slice(-200),
          }
        }),
      importState: (data) =>
        set({
          xp: data.xp ?? 0,
          srs: data.srs ?? {},
          sessions: data.sessions ?? [],
          drillBest: data.drillBest ?? {},
        }),
      reset: () => set({ xp: 0, srs: {}, sessions: [], drillBest: {} }),
    }),
    {
      name: PROGRESS_STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        schemaVersion: s.schemaVersion,
        xp: s.xp,
        srs: s.srs,
        sessions: s.sessions,
        drillBest: s.drillBest,
      }),
      migrate: (persisted, version) => {
        const state = persisted as ProgressState
        if (version < 2) {
          return { ...state, schemaVersion: 2 as const, drillBest: {} }
        }
        return state
      },
    },
  ),
)
