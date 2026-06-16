// ============================================================
// Match — 火柴对象（纯火柴杆，火焰由 Scene 独立管理）
// ============================================================
import { Container, Sprite, Texture, Point } from 'pixi.js'
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

  /** 获取火柴头顶部的世界坐标（通过世界变换矩阵正确计算旋转后的位置） */
  getHeadPosition(): { x: number; y: number } {
    // body 锚点(0.3, 0.9)，头顶在 body 本地坐标 (0, -texH * scale * 0.9)
    const localY = -this.body.height * this.body.scale.y * 0.9
    const gp = this.toGlobal(new Point(0, localY))
    return { x: gp.x, y: gp.y }
  }

  /** 设置身体缩放 */
  setBodyScale(s: number): void {
    this.body.scale.set(s)
  }

  ignite(): void {
    if (this.isLit) return
    this.isLit = true
  }

  hide(): void {
    this.visible = false
  }
}
