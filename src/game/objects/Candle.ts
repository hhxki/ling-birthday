// ============================================================
// Candle — 蛋糕蜡烛对象
// ============================================================
import { Container, Sprite, Texture, Graphics } from 'pixi.js'
import gsap from 'gsap'

export class Candle extends Container {
  private base: Sprite
  private flameContainer: Container
  private flameGlow: Graphics
  private _litProgress = 0 // 0 ~ 1

  constructor(cakeTexture: Texture) {
    super()

    // 蛋糕本体
    this.base = new Sprite(cakeTexture)
    this.base.anchor.set(0.5, 0.5)
    // 如果纹理是 WHITE fallback，给一个默认视觉尺寸
    if (cakeTexture === Texture.WHITE) {
      this.base.width = 160
      this.base.height = 160
    }
    this.addChild(this.base)

    // 火焰层
    this.flameContainer = new Container()
    this.addChild(this.flameContainer)

    // 初始光晕
    this.flameGlow = new Graphics()
    this.flameGlow.alpha = 0
    this.flameContainer.addChild(this.flameGlow)
  }

  get litProgress(): number {
    return this._litProgress
  }

  /** 增加亮度（收集到粒子时调用） */
  addLight(delta: number): void {
    this._litProgress = Math.min(1, this._litProgress + delta)

    // 绘制蜡烛火焰光晕
    this.flameGlow.clear()
    const radius = 20 + this._litProgress * 30
    const alpha = 0.3 + this._litProgress * 0.7
    this.flameGlow.circle(0, -this.base.height * 0.35, radius)
    this.flameGlow.fill({ color: 0xffb03a, alpha })

    gsap.to(this.flameGlow, {
      alpha: alpha * 0.6,
      duration: 0.4,
      yoyo: true,
      repeat: 0,
      ease: 'sine.inOut',
    })
  }

  /** 完全点燃 */
  igniteFull(): void {
    this._litProgress = 1
    this.flameGlow.clear()
    this.flameGlow.circle(0, -this.base.height * 0.35, 50)
    this.flameGlow.fill({ color: 0xffb03a, alpha: 0.9 })

    gsap.to(this.flameGlow, {
      alpha: 0.5,
      duration: 0.6,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    })
  }

  /** 吹灭 */
  blowOut(): void {
    gsap.to(this.flameGlow, {
      alpha: 0,
      duration: 0.8,
      ease: 'power2.in',
    })
    this._litProgress = 0
  }

  /** 重置 */
  reset(): void {
    this._litProgress = 0
    this.flameGlow.clear()
    this.flameGlow.alpha = 0
  }
}
