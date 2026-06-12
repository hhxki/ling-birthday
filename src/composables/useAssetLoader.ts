// ============================================================
// useAssetLoader — PixiJS 资源预加载管理
// ============================================================
import { ref, readonly } from 'vue'
import { Assets } from 'pixi.js'
import type { AssetEntry } from '../types'

const progress = ref(0)
const loaded = ref(false)
const errors = ref<string[]>([])

export function useAssetLoader() {
  /**
   * 批量加载资源清单
   * 使用 PixiJS v8 Assets.load 数组形式，自动缓存到 alias
   */
  async function loadAssets(assets: AssetEntry[]): Promise<void> {
    if (assets.length === 0) {
      progress.value = 100
      loaded.value = true
      return
    }

    try {
      // PixiJS v8 批量加载 + 进度回调
      await Assets.load(
        assets.map((a) => ({ alias: a.alias, src: a.src })),
        (p) => {
          progress.value = Math.round(p * 100)
        },
      )
    } catch (e) {
      errors.value.push(`Asset bundle error: ${String(e)}`)
    }

    loaded.value = true
    progress.value = 100
  }

  /**
   * 后台加载（不阻塞，静默失败）
   */
  function loadInBackground(assets: AssetEntry[]): void {
    Assets.load(
      assets.map((a) => ({ alias: a.alias, src: a.src })),
    ).catch(() => {
      // 后台资源静默失败，不阻塞体验
    })
  }

  return {
    progress: readonly(progress),
    loaded: readonly(loaded),
    errors: readonly(errors),
    loadAssets,
    loadInBackground,
  }
}
