// ============================================================
// CandleScene — Stage 3: 吹蜡烛
// ============================================================
import { Container, Sprite, Texture, Graphics } from 'pixi.js'
import gsap from 'gsap'
import { AudioAnalyzer } from '../utils/audioAnalyzer'

export class CandleScene extends Container {
  roomBg: Sprite
  private candleSprite: Sprite
  private flameGraphics: Graphics
  private analyzer: AudioAnalyzer
  private blown = false
  private particles: Graphics[] = []
  private sceneW = 1920
  private sceneH = 1080

  onBlown?: () => void
  onMicDenied?: () => void

  constructor() {
    super()

    this.roomBg = new Sprite(Texture.WHITE)
    this.addChild(this.roomBg)

    this.candleSprite = new Sprite(Texture.WHITE)
    this.candleSprite.anchor.set(0.5)
    this.addChild(this.candleSprite)

    this.flameGraphics = new Graphics()
    this.addChild(this.flameGraphics)

    this.analyzer = new AudioAnalyzer()
  }

  init(roomTex: Texture, cakeTexture: Texture, w: number, h: number): void {
    this.sceneW = w
    this.sceneH = h

    // 背景居中 cover
    this.roomBg.texture = roomTex
    this.roomBg.anchor.set(0.5)
    this.roomBg.x = this.sceneW / 2
    this.roomBg.y = this.sceneH / 2
    const texW = roomTex.width || this.sceneW
    const texH = roomTex.height || this.sceneH
    this.roomBg.scale.set(Math.max(this.sceneW / texW, this.sceneH / texH))

    // 蛋糕
    this.candleSprite.texture = cakeTexture
    this.candleSprite.x = this.sceneW / 2
    this.candleSprite.y = this.sceneH * 0.6
    const cakeScale = Math.min(this.sceneW * 0.4 / (cakeTexture.width || 256), 1.5)
    this.candleSprite.scale.set(cakeScale)

    this.blown = false
    this.drawFlame()
  }

  private drawFlame(): void {
    const cx = this.candleSprite.x
    const cy = this.candleSprite.y - this.candleSprite.height * this.candleSprite.scale.y * 0.35
    this.flameGraphics.clear()
    this.flameGraphics.ellipse(cx, cy - 15, 15, 35)
    this.flameGraphics.fill({ color: 0xffb03a, alpha: 0.9 })
    this.flameGraphics.ellipse(cx, cy - 10, 8, 25)
    this.flameGraphics.fill({ color: 0xffffff, alpha: 0.6 })
    gsap.to(this.flameGraphics, { alpha: 0.7, duration: 0.3, yoyo: true, repeat: -1, ease: 'sine.inOut' })
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
    gsap.to(this.flameGraphics, {
      alpha: 0, skewX: 30, duration: 0.8, ease: 'power2.in',
      onComplete: () => { this.flameGraphics.clear(); this.spawnBlownParticles() },
    })
  }

  private spawnBlownParticles(): void {
    const cx = this.candleSprite.x
    const cy = this.candleSprite.y - 60
    for (let i = 0; i < 80; i++) {
      const p = new Graphics()
      p.circle(0, 0, 2 + Math.random() * 4)
      p.fill({ color: 0xffb03a, alpha: 0.8 })
      p.x = cx; p.y = cy
      this.addChild(p); this.particles.push(p)
      const angle = Math.random() * Math.PI * 2
      const dist = 200 + Math.random() * 600
      gsap.to(p, {
        x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist,
        alpha: 0.3 + Math.random() * 0.5, duration: 1.5 + Math.random() * 1.5, ease: 'power2.out',
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
    this.candleSprite.x = w / 2
    this.candleSprite.y = h * 0.6
  }

  destroyScene(): void {
    gsap.killTweensOf(this.flameGraphics)
    this.analyzer.stop()
    for (const p of this.particles) gsap.killTweensOf(p)
    this.destroy({ children: true })
  }
}
