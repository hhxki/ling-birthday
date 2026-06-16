// ============================================================
// useAudio — Howler.js 全局音频管理
// ============================================================
import { Howl, Howler } from 'howler'
import { ref, readonly } from 'vue'
import { AUDIO_CONFIG } from '../data/config'

const bgmPlaying = ref(false)
const sfxEnabled = ref(true)

let bgm: Howl | null = null
const sfxCache = new Map<string, Howl>()

/** BGM 还没真正播起来之前，音效请求暂存这里 */
const pendingSFX: Array<{ src: string; volume: number }> = []

/** 补播所有排队的音效 */
function flushPendingSFX(): void {
  for (const { src, volume } of pendingSFX) {
    let sfx = sfxCache.get(src)
    if (!sfx) {
      sfx = new Howl({ src: [src], html5: true, volume })
      sfxCache.set(src, sfx)
    }
    sfx.volume(volume)
    sfx.play()
  }
  pendingSFX.length = 0
}

export function useAudio() {
  /** 初始化并播放 BGM */
  function playBGM(src: string, volume = 0.3): void {
    if (bgm) {
      bgm.stop()
      bgm.unload()
    }
    bgm = new Howl({
      src: [src],
      html5: true, // 流式加载
      loop: true,
      volume,
    })
    bgm.play()
    bgmPlaying.value = true

    // BGM 已经开始播了 → 补播之前排队的音效
    // 桌面端：pointerdown 时 BGM 就播起来了，这里立即 flush
    // 移动端：touchend 时 BGM 才真正播起来，这里补播擦火声等
    flushPendingSFX()
  }

  /** 暂停 BGM */
  function pauseBGM(): void {
    bgm?.pause()
    bgmPlaying.value = false
  }

  /** 恢复 BGM */
  function resumeBGM(): void {
    bgm?.play()
    bgmPlaying.value = true
  }

  /** 设置 BGM 音量 */
  function setBGMVolume(v: number): void {
    bgm?.volume(v)
  }

  /** 智能压低 BGM（播放语音/视频时调用） */
  function duckBGM(): void {
    if (!bgm) return
    bgm.volume(AUDIO_CONFIG.duckBgmVolume)
  }

  /** 恢复 BGM 音量 */
  function restoreBGM(vol: number): void {
    if (!bgm) return
    bgm.volume(vol)
  }

  /** 播放一次性音效 */
  function playSFX(src: string, volume = 0.5): void {
    if (!sfxEnabled.value) return

    // BGM 还没真正播起来 → 音效排队（移动端首次拖拽时的情况）
    if (!isBGMPlaying()) {
      pendingSFX.push({ src, volume })
      return
    }

    // BGM 已经在播 → 音效即时播放
    let sfx = sfxCache.get(src)
    if (!sfx) {
      sfx = new Howl({ src: [src], html5: true, volume })
      sfxCache.set(src, sfx)
    }
    sfx.volume(volume)
    sfx.play()
  }

  /** 播放粉丝语音（流式，不缓存） */
  function playVoice(url: string): Howl {
    const voice = new Howl({
      src: [url],
      html5: true,
      volume: 0.7,
    })
    voice.play()
    return voice
  }

  /** 全局静音/取消静音 */
  function toggleMute(): boolean {
    const muted = !Howler.volume()
    Howler.volume(muted ? 1 : 0)
    return !muted
  }

  /** 检查 BGM 是否真正在播放 */
  function isBGMPlaying(): boolean {
    return bgm?.playing() ?? false
  }

  /** 销毁所有音频 */
  function destroyAll(): void {
    bgm?.stop()
    bgm?.unload()
    bgm = null
    bgmPlaying.value = false
    for (const sfx of sfxCache.values()) {
      sfx.unload()
    }
    sfxCache.clear()
    pendingSFX.length = 0
  }

  return {
    bgmPlaying: readonly(bgmPlaying),
    playBGM,
    pauseBGM,
    resumeBGM,
    setBGMVolume,
    duckBGM,
    restoreBGM,
    playSFX,
    playVoice,
    toggleMute,
    isBGMPlaying,
    destroyAll,
  }
}
