// ============================================================
// useMicrophone — 麦克风权限 & 分贝检测
// ============================================================
import { ref, readonly, onUnmounted } from 'vue'
import type { MicStatus } from '../types'
import { BLOW_CONFIG } from '../data/config'

const micStatus = ref<MicStatus>('idle')
const currentVolume = ref(0) // 0 ~ 1
const isBlowing = ref(false)

let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let dataArray: Uint8Array | null = null
let animationId = 0
let blowStartTime = 0
let timeoutId: ReturnType<typeof setTimeout> | null = null

export function useMicrophone() {
  /** 请求麦克风权限并开始分析 */
  async function requestMic(): Promise<void> {
    if (micStatus.value === 'ready') return

    micStatus.value = 'requesting'

    // 超时检测：超过 BLOW_CONFIG.micTimeout 未成功 = 自动降级
    timeoutId = setTimeout(() => {
      if (micStatus.value === 'requesting') {
        micStatus.value = 'denied'
      }
    }, BLOW_CONFIG.micTimeout)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      if (timeoutId) clearTimeout(timeoutId)

      audioCtx = new AudioContext()
      analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256

      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)

      dataArray = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount))
      micStatus.value = 'ready'
      startLoop()
    } catch {
      if (timeoutId) clearTimeout(timeoutId)
      micStatus.value = 'denied'
    }
  }

  /** 轮询分贝值 */
  function startLoop(): void {
    function tick() {
      if (!analyser || !dataArray) return

      analyser.getByteTimeDomainData(dataArray as Uint8Array<ArrayBuffer>)

      // 计算 RMS
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128
        sum += normalized * normalized
      }
      const rms = Math.sqrt(sum / dataArray.length)
      currentVolume.value = rms

      // 吹气检测
      if (rms >= BLOW_CONFIG.dbThreshold) {
        if (blowStartTime === 0) {
          blowStartTime = performance.now()
        } else if (performance.now() - blowStartTime >= BLOW_CONFIG.sustainDuration) {
          isBlowing.value = true
        }
      } else {
        blowStartTime = 0
        isBlowing.value = false
      }

      animationId = requestAnimationFrame(tick)
    }
    animationId = requestAnimationFrame(tick)
  }

  /** 获取当前是否在吹气 */
  function checkBlow(): boolean {
    return isBlowing.value
  }

  /** 重置吹气状态 */
  function resetBlow(): void {
    isBlowing.value = false
    blowStartTime = 0
  }

  /** 清理资源 */
  function cleanup(): void {
    if (animationId) cancelAnimationFrame(animationId)
    if (timeoutId) clearTimeout(timeoutId)
    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {})
    }
    audioCtx = null
    analyser = null
    dataArray = null
    micStatus.value = 'idle'
    currentVolume.value = 0
    isBlowing.value = false
  }

  onUnmounted(cleanup)

  return {
    micStatus: readonly(micStatus),
    currentVolume: readonly(currentVolume),
    isBlowing: readonly(isBlowing),
    requestMic,
    checkBlow,
    resetBlow,
    cleanup,
  }
}
