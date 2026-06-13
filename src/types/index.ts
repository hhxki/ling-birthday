// ============================================================
// 核心类型定义 — Ling Birthday
// ============================================================

/** 游戏阶段状态机 */
export type GameStage =
  | 'loading'
  | 'match'
  | 'wishes'
  | 'blow-candle'
  | 'timeline'
  | 'ending'

/** 粉丝祝福数据 — id 用于排序和去重，user 是显示名 */
export interface Blessing {
  id: string
  user: string
  text: string
  avatarUrl?: string
  audioUrl?: string
}

/** 时光长廊条目 */
export interface TimelineItem {
  id: string
  date: string
  title: string
  description: string
  imageUrl: string
}

/** 资源清单条目 */
export interface AssetManifest {
  bundles: AssetBundle[]
}

export interface AssetBundle {
  name: string
  assets: AssetEntry[]
}

export interface AssetEntry {
  alias: string
  src: string
}

/** 麦克风状态 */
export type MicStatus = 'idle' | 'requesting' | 'ready' | 'denied' | 'error'

/** 全局游戏状态（供 useGameState 使用） */
export interface GameState {
  currentStage: GameStage
  loadingProgress: number // 0-100
  wishesCollected: number
  totalWishes: number
  candleLit: boolean
  isBlown: boolean
  micStatus: MicStatus
}

/** 萤火虫粒子状态 */
export interface FireflyState {
  id: string
  x: number
  y: number
  baseX: number
  baseY: number
  phase: number // Perlin noise phase offset
  collected: boolean
  blessingFrom: string
}
