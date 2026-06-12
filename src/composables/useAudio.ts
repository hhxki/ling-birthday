// ============================================================
// useAudio — Howler.js 全局音频管理
// ============================================================
import { Howl, Howler } from 'howler'
import { ref, readonly } from 'vue'

const bgmPlaying = ref(false)
const sfxEnabled = ref(true)

let bgm: Howl | null = null
const sfxCache = new Map<string, Howl>()

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

  /** 播放一次性音效 */
  function playSFX(src: string, volume = 0.5): void {
    if (!sfxEnabled.value) return

    // 缓存复用
    let sfx = sfxCache.get(src)
    if (!sfx) {
      sfx = new Howl({
        src: [src],
        html5: true,
        volume,
      })
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
  }

  return {
    bgmPlaying: readonly(bgmPlaying),
    playBGM,
    pauseBGM,
    resumeBGM,
    setBGMVolume,
    playSFX,
    playVoice,
    toggleMute,
    destroyAll,
  }
}
