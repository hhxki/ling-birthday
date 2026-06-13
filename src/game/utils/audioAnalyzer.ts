// ============================================================
// audioAnalyzer — 独立麦克风分贝分析工具
// 供 PixiJS Scene 端直接调用，获取实时的分贝状态
// ============================================================
import { BLOW_CONFIG } from '../../data/config'

export type AnalyzerCallback = (volume: number, isBlowing: boolean) => void

export class AudioAnalyzer {
  private audioCtx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private dataArray: Uint8Array | null = null
  private animationId = 0
  private blowStartTime = 0
  private callback: AnalyzerCallback | null = null

  /** 请求麦克风并开始分析 */
  async start(onUpdate: AnalyzerCallback): Promise<'ready' | 'denied'> {
    this.callback = onUpdate

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.audioCtx = new AudioContext()
      this.analyser = this.audioCtx.createAnalyser()
      this.analyser.fftSize = 256

      const source = this.audioCtx.createMediaStreamSource(stream)
      source.connect(this.analyser)

      this.dataArray = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount))
      this.loop()
      return 'ready'
    } catch {
      return 'denied'
    }
  }

  private loop = (): void => {
    if (!this.analyser || !this.dataArray || !this.callback) return

    this.analyser.getByteTimeDomainData(this.dataArray as Uint8Array<ArrayBuffer>)

    let sum = 0
    for (let i = 0; i < this.dataArray.length; i++) {
      const normalized = (this.dataArray[i] - 128) / 128
      sum += normalized * normalized
    }
    const rms = Math.sqrt(sum / this.dataArray.length)

    let isBlowing = false
    if (rms >= BLOW_CONFIG.dbThreshold) {
      if (this.blowStartTime === 0) {
        this.blowStartTime = performance.now()
      } else if (performance.now() - this.blowStartTime >= BLOW_CONFIG.sustainDuration) {
        isBlowing = true
      }
    } else {
      this.blowStartTime = 0
    }

    this.callback(rms, isBlowing)
    this.animationId = requestAnimationFrame(this.loop)
  }

  /** 检查当前是否在吹气 */
  isBlowingNow(): boolean {
    // 由 loop 中的 callback 更新外部状态
    return false
  }

  /** 停止并清理 */
  stop(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId)
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {})
    }
    this.audioCtx = null
    this.analyser = null
    this.dataArray = null
    this.callback = null
    this.blowStartTime = 0
  }
}
