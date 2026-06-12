// ============================================================
// FireParticle — 萤火虫粒子（柔光烟雾风格）
// ============================================================
import { Container, Sprite, Texture, Rectangle } from 'pixi.js'
import gsap from 'gsap'
import type { FireflyState } from '../../types'

export class FireParticle extends Container {
  sprite: Sprite
  data: FireflyState
  private floatTime = 0
  private floatSpeed: number
  private floatAmp: number

  constructor(texture: Texture, state: FireflyState) {
    super()
    this.data = state

    // 柔光烟雾粒子本体（线性减淡叠加）
    this.sprite = new Sprite(texture)
    this.sprite.anchor.set(0.5)
    this.sprite.blendMode = 'add'
    this.sprite.tint = 0xffb03a
    this.sprite.alpha = 0.6
    const s = 0.3 + Math.random() * 0.4
    this.sprite.scale.set(s)
    this.addChild(this.sprite)

    // 扩大可点击区域
    this.hitArea = new Rectangle(-30, -30, 60, 60)

    this.x = state.x
    this.y = state.y

    this.floatSpeed = 0.3 + Math.random() * 0.7
    this.floatAmp = 15 + Math.random() * 30

    this.eventMode = 'static'
    this.cursor = 'pointer'
  }

  /** 每帧更新萤火虫漂浮 */
  update(delta: number): void {
    if (this.data.collected) return

    this.floatTime += delta * 0.01 * this.floatSpeed

    const offsetX = Math.sin(this.floatTime * 1.3 + this.data.phase) * this.floatAmp
    const offsetY = Math.cos(this.floatTime * 0.9 + this.data.phase * 1.7) * this.floatAmp * 0.7

    this.x = this.data.baseX + offsetX
    this.y = this.data.baseY + offsetY

    // 柔和呼吸
    this.sprite.alpha = 0.4 + Math.sin(this.floatTime * 2.5) * 0.25
  }

  /** 收集动画：飞向目标 */
  collectTo(targetX: number, targetY: number): Promise<void> {
    return new Promise((resolve) => {
      this.data.collected = true
      this.eventMode = 'none'
      this.cursor = 'inherit'

      gsap.to(this, {
        x: targetX, y: targetY,
        duration: 1.0, ease: 'power3.in',
      })
      gsap.to(this.sprite.scale, {
        x: 0.1, y: 0.1,
        duration: 1.0, ease: 'power3.in',
      })
      gsap.to(this.sprite, {
        alpha: 0.8, duration: 0.6, ease: 'power3.in',
        onComplete: () => {
          this.visible = false
          this.alpha = 0
          resolve()
        },
      })
    })
  }
}
