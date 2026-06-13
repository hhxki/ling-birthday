// ============================================================
// 音频资源清单 — BGM、音效、语音
// 所有路径通过 asset() 拼接，自动适配 CDN / 本地模式
// 新增音频直接追加到对应分类即可
// ============================================================
import { asset } from './config'

// ---- BGM（背景音乐，loop 播放）----

export const BGM = {
  /** 主界面 BGM（划火柴 + 收集萤火虫阶段） */
  main: asset('/audio/main.mp3'),
  /** 吹蜡烛阶段 BGM（可选，不设则沿用 main） */
  candle: asset('/audio/candle.mp3'),
  /** 结尾鸣谢 BGM */
  ending: asset('/audio/ending.mp3'),
} as const

// ---- SFX（一次性音效，不循环）----

export const SFX = {
  /** 火柴划燃 */
  matchStrike: asset('/audio/match-strike.mp3'),
  /** 萤火虫被收集 */
  fireflyCollect: asset('/audio/firefly-collect.mp3'),
  /** 全部收集完成 */
  allCollected: asset('/audio/all-collected.mp3'),
  /** 蜡烛吹灭 */
  candleBlow: asset('/audio/candle-blow.mp3'),
  /** 贺卡打开 */
  cardOpen: asset('/audio/card-open.mp3'),
  /** 贺卡关闭 */
  cardClose: asset('/audio/card-close.mp3'),
  /** 按钮点击 */
  buttonClick: asset('/audio/button-click.mp3'),
} as const

// 汇总所有 BGM（方便批量预加载）
export const ALL_BGM = Object.values(BGM)
// 汇总所有 SFX（方便批量预加载）
export const ALL_SFX = Object.values(SFX)
