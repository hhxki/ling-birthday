// ============================================================
// CandleScene — Stage 3: 吹蜡烛（蜡烛在背景图里）
// ============================================================
import { Container, Sprite, Texture } from 'pixi.js'
import gsap from 'gsap'
import { AudioAnalyzer } from '../utils/audioAnalyzer'
import { FireParticle } from '../objects/FireParticle'
import { PARTICLE_CONFIG } from '../../data/config'
import type { FireflyState } from '../../types'

export class CandleScene extends Container {
  roomBg: Sprite
  private analyzer: AudioAnalyzer
  private blown = false
  private particles: FireParticle[] = []
  private sceneW = 1920
  private sceneH = 1080
  private particleTexture: Texture = Texture.WHITE
  private idCounter = 0

  onBlown?: () => void
  onMicDenied?: () => void

  constructor() {
    super()
    this.roomBg = new Sprite(Texture.WHITE)
    this.addChild(this.roomBg)
    this.analyzer = new AudioAnalyzer()
  }

  init(roomTex: Texture, particleTex: Texture, w: number, h: number): void {
    this.sceneW = w
    this.sceneH = h
    this.particleTexture = particleTex

    this.roomBg.texture = roomTex
    this.roomBg.anchor.set(0.5)
    this.roomBg.x = w / 2
    this.roomBg.y = h / 2
    const texW = roomTex.width || w
    const texH = roomTex.height || h
    this.roomBg.scale.set(Math.max(w / texW, h / texH))

    this.blown = false
  }

  async startMicListen(): Promise<void> {
    const result = await this.analyzer.start((_v, isBlowing) => {
      if (isBlowing && !this.blown) this.blowOut()
    })
    if (result === 'denied') this.onMicDenied?.()
  }

  blowOut(): void {
    if (this.blown) return
    this.blown = true

    const cx = this.sceneW * PARTICLE_CONFIG.candleX
    const cy = this.sceneH * PARTICLE_CONFIG.candleY
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = 250 + Math.random() * 500
      const state: FireflyState = {
        id: `blow_${++this.idCounter}`,
        x: cx, y: cy,
        baseX: cx, baseY: cy,
        phase: Math.random() * Math.PI * 2,
        collected: true,
        blessingFrom: '',
      }
      const p = new FireParticle(this.particleTexture, state)
      p.alpha = 1
      p.zIndex = 10
      this.addChild(p)
      this.particles.push(p)

      gsap.to(p, {
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        alpha: 0,
        duration: 1.5 + Math.random() * 1.5,
        ease: 'power3.out',
        onComplete: () => {
          if (p.parent) p.parent.removeChild(p)
          p.destroy()
        },
      })
    }
    gsap.delayedCall(3, () => this.onBlown?.())
  }

  stopMic(): void { this.analyzer.stop() }

  onResize(w: number, h: number): void {
    this.sceneW = w
    this.sceneH = h
    const texW = this.roomBg.texture.width || w
    const texH = this.roomBg.texture.height || h
    this.roomBg.scale.set(Math.max(w / texW, h / texH))
    this.roomBg.x = w / 2
    this.roomBg.y = h / 2
  }

  destroyScene(): void {
    this.analyzer.stop()
    for (const p of this.particles) {
      gsap.killTweensOf(p)
      if (p.parent) p.parent.removeChild(p)
      p.destroy()
    }
    this.particles = []
    this.destroy({ children: true })
  }
}
