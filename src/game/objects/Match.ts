// ============================================================
// Match — 火柴对象（纯火柴杆，火焰由 Scene 独立管理）
// ============================================================
import { Container, Sprite, Texture } from 'pixi.js'
import { MATCH_CONFIG } from '../../data/config'

export class Match extends Container {
  body: Sprite
  isLit = false

  constructor(bodyTexture: Texture) {
    super()

    this.body = new Sprite(bodyTexture)
    this.body.anchor.set(0.3, 0.9)
    this.body.scale.set(MATCH_CONFIG.matchScale)
    this.addChild(this.body)

    this.eventMode = 'none'
    this.visible = false
  }

  show(x: number, y: number): void {
    this.x = x
    this.y = y
    this.visible = true
    this.alpha = 1
    this.isLit = false
    this.rotation = MATCH_CONFIG.matchRotation
  }

  follow(x: number, y: number): void {
    this.x = x
    this.y = y
  }

  /** 获取火柴头顶部的世界坐标（供火焰定位） */
  getHeadPosition(): { x: number; y: number } {
    // anchor (0.3, 0.9): pivot 在底部 10% 处，顶部在 pivot 上方 90% 处
    const localY = -this.body.height * this.body.scale.y * 0.85
    return {
      x: this.x,
      y: this.y + localY,
    }
  }

  ignite(): void {
    if (this.isLit) return
    this.isLit = true
  }

  hide(): void {
    this.visible = false
  }
}
