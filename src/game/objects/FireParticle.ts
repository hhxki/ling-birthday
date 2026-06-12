// ============================================================
// FireParticle — 萤火虫/火光粒子对象
// ============================================================
import { Container, Sprite, Texture, Graphics, Rectangle } from 'pixi.js'
import gsap from 'gsap'
import type { FireflyState } from '../../types'

export class FireParticle extends Container {
  sprite: Sprite
  glow: Graphics
  data: FireflyState

  // 浮动参数
  private floatTime = 0
  private floatSpeed: number
  private floatAmp: number

  constructor(texture: Texture, state: FireflyState) {
    super()
    this.data = state

    // 外层大光晕
    this.glow = new Graphics()
    this.glow.circle(0, 0, 22)
    this.glow.fill({ color: 0xffb03a, alpha: 0.25 })
    this.addChild(this.glow)

    // 粒子本体
    this.sprite = new Sprite(texture)
    this.sprite.anchor.set(0.5)
    this.sprite.scale.set(0.9)
    this.sprite.tint = 0xffb03a
    this.addChild(this.sprite)

    // 扩大可点击区域
    this.hitArea = new Rectangle(-30, -30, 60, 60)

    // 设置初始位置
    this.x = state.x
    this.y = state.y

    // 随机浮动参数
    this.floatSpeed = 0.3 + Math.random() * 0.7
    this.floatAmp = 15 + Math.random() * 30

    // 交互
    this.eventMode = 'static'
    this.cursor = 'pointer'
  }

  /** 每帧更新萤火虫漂浮 */
  update(delta: number): void {
    if (this.data.collected) return

    this.floatTime += delta * 0.01 * this.floatSpeed

    // sin/cos 叠加模拟自然漂浮
    const offsetX = Math.sin(this.floatTime * 1.3 + this.data.phase) * this.floatAmp
    const offsetY = Math.cos(this.floatTime * 0.9 + this.data.phase * 1.7) * this.floatAmp * 0.7

    this.x = this.data.baseX + offsetX
    this.y = this.data.baseY + offsetY

    // 明暗呼吸
    this.sprite.alpha = 0.6 + Math.sin(this.floatTime * 2) * 0.4
    this.glow.alpha = 0.2 + Math.sin(this.floatTime * 2.3) * 0.2
  }

  /** 收集动画：飞向目标 */
  collectTo(targetX: number, targetY: number): Promise<void> {
    return new Promise((resolve) => {
      this.data.collected = true
      this.eventMode = 'none'
      this.cursor = 'inherit'

      // 缩小 + 飞向蜡烛
      gsap.to(this, {
        x: targetX,
        y: targetY,
        duration: 1.2,
        ease: 'power2.in',
      })
      gsap.to(this.sprite.scale, {
        x: 0.2,
        y: 0.2,
        duration: 1.2,
        ease: 'power2.in',
      })
      gsap.to(this.glow, {
        alpha: 0.8,
        duration: 0.8,
        ease: 'power2.in',
        onComplete: () => {
          this.visible = false
          this.alpha = 0
          resolve()
        },
      })
    })
  }
}
