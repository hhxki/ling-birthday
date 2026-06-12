// ============================================================
// 全局配置 — CDN 前缀、关键常量
// ============================================================

/** CDN 开关：true = 生产模式用 CDN，false = 测试模式用本地资源 */
export const USE_CDN = import.meta.env.VITE_USE_CDN === 'true'

/** 生产环境 CDN 基础路径 */
const CDN_BASE_URL = 'https://cdn.example.com/ling-birthday'

/** 测试环境本地资源路径（public/ 下的目录） */
const LOCAL_ASSET_PATH = '/test-assets'

/**
 * 根据 CDN 开关拼接资源路径
 * 测试模式：映射到 public/test-assets/，保持原始扩展名
 * 生产模式：映射到 CDN 完整路径
 */
export function asset(path: string): string {
  if (USE_CDN) {
    return `${CDN_BASE_URL}${path}`
  }
  // 去掉 /assets/ 前缀，落到 public/test-assets/ 下
  return `${LOCAL_ASSET_PATH}${path.replace('/assets', '')}`
}

/** 背景音乐路径 */
export function bgmAsset(path: string): string {
  if (USE_CDN) {
    return `${CDN_BASE_URL}${path}`
  }
  return `${LOCAL_ASSET_PATH}${path.replace('/assets', '')}`
}

/** 关键资源清单（优先加载） */
export const CRITICAL_ASSETS = [
  { alias: 'match-body', src: asset('/assets/火柴.png') },
  { alias: 'match-head', src: asset('/assets/火柴.png') },
  { alias: 'match-flame', src: asset('/assets/火柴火焰.png') },
  { alias: 'matchbox', src: asset('/assets/火柴盒.png') },
  { alias: 'match-bg', src: asset('/assets/火柴背景.png') },
  { alias: 'fire-particle', src: asset('/assets/particle-smoke.png') },
  { alias: 'glow-particle', src: asset('/assets/particle-smoke.png') },
  { alias: 'room-dark', src: asset('/assets/房间暗.png') },
  { alias: 'room-bright', src: asset('/assets/房间亮.png') },
]

/** 火柴交互配置 */
export const MATCH_CONFIG = {
  // --- 触发条件 ---
  /** 触发点燃的最低速度阈值 (px/frame) */
  minSpeed: 10,
  /** 触发点燃的最低距离阈值 (px) */
  minDistance: 80,
  /** 火柴头上方比例 (顶部作为触发点) */
  matchHeadRatio: 0.1,
  /** 火柴盒磷片比例 (底部作为擦条) */
  phosphorRatio: 0.2,

  // --- 火柴盒 ---
  /** 火柴盒宽度占屏幕宽度的比例 */
  matchboxWidthRatio: 0.4,
  /** 火柴盒最大缩放倍数 */
  matchboxMaxScale: 1.0,
  /** 火柴盒水平位置 (屏幕宽度比例, 0=左 1=右) */
  matchboxX: 0.45,
  /** 火柴盒垂直位置 (屏幕高度比例, 0=顶 1=底) */
  matchboxY: 0.5,
  /** 火柴盒旋转角度 (弧度) */
  matchboxRotation: -1,

  // --- 火柴 ---
  /** 火柴相对于火柴盒的水平偏移 (倍火柴盒宽度, 正=右) */
  matchOffsetX: 1,
  /** 火柴相对于火柴盒的垂直偏移 (倍火柴盒高度, 负=上) */
  matchOffsetY: 0.5,
  /** 火柴缩放 */
  matchScale: 0.9,
  /** 火柴初始旋转角度 (弧度) */
  matchRotation: -0.5,

  // --- 火焰 ---
  /** 火焰相对于火柴头顶部的 X 偏移 (px) */
  flameOffsetX: -78,
  /** 火焰相对于火柴头顶部的 Y 偏移 (px, 负=上) */
  flameOffsetY: 10,
  /** 火焰初始缩放 */
  flameScale: 0.8,
}

/** 粒子配置 */
export const PARTICLE_CONFIG = {
  /** Stage 2 萤火虫粒子数量 */
  fireflyCount: 25,
  /** 粒子大小范围 */
  minSize: 8,
  maxSize: 22,
  /** 萤火虫漂浮幅度 */
  floatAmplitude: 50,
  /** 收集飞行时长 (秒) */
  collectDuration: 1.0,
  /** 蜡烛/收集目标水平位置 (屏幕宽度比例, 0=左 1=右) */
  candleX: 0.5,
  /** 蜡烛/收集目标垂直位置 (屏幕高度比例, 0=顶 1=底) */
  candleY: 0.65,
}

/** 吹蜡烛配置 */
export const BLOW_CONFIG = {
  /** 分贝阈值 (RMS, 0~1)，越小越灵敏 */
  dbThreshold: 0.06,
  /** 持续超过阈值的时间 (ms) */
  sustainDuration: 150,
  /** 麦克风超时 (ms) — 超过则显示降级按钮 */
  micTimeout: 3000,
}
