// ============================================================
// useGameState — 全局游戏状态机
// ============================================================
import { reactive, readonly } from 'vue'
import type { GameStage, GameState } from '../types'

const state = reactive<GameState>({
  currentStage: 'match',
  loadingProgress: 0,
  wishesCollected: 0,
  totalWishes: 0,
  candleLit: false,
  isBlown: false,
  micStatus: 'idle',
})

/** 按顺序的阶段列表 */
const STAGE_ORDER: GameStage[] = [
  'match',
  'wishes',
  'blow-candle',
  'timeline',
  'ending',
]

export function useGameState() {
  /** 切换到指定阶段 */
  function goToStage(stage: GameStage): void {
    state.currentStage = stage
  }

  /** 进入下一个阶段 */
  function nextStage(): void {
    const idx = STAGE_ORDER.indexOf(state.currentStage)
    if (idx >= 0 && idx < STAGE_ORDER.length - 1) {
      state.currentStage = STAGE_ORDER[idx + 1]
    }
  }

  /** 设置加载进度 */
  function setLoadingProgress(p: number): void {
    state.loadingProgress = Math.min(100, Math.max(0, p))
  }

  /** 收集到一个祝福 */
  function collectWish(): void {
    state.wishesCollected++
    if (state.wishesCollected >= state.totalWishes) {
      state.candleLit = true
    }
  }

  /** 蜡烛吹灭 */
  function blowOut(): void {
    state.isBlown = true
  }

  /** 设置总祝福数 */
  function setTotalWishes(n: number): void {
    state.totalWishes = n
  }

  /** 设置麦克风状态 */
  function setMicStatus(s: GameState['micStatus']): void {
    state.micStatus = s
  }

  /** 重置到初始状态（再来一次） */
  function reset(): void {
    state.currentStage = 'match'
    state.loadingProgress = 0
    state.wishesCollected = 0
    state.totalWishes = 0
    state.candleLit = false
    state.isBlown = false
    state.micStatus = 'idle'
  }

  return {
    state: readonly(state) as Readonly<GameState>,
    goToStage,
    nextStage,
    setLoadingProgress,
    collectWish,
    blowOut,
    setTotalWishes,
    setMicStatus,
    reset,
  }
}
