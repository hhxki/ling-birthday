// ============================================================
// MatchScene — Stage 1: 划火柴
// ============================================================
import { Container, Sprite, Texture, Graphics, BlurFilter } from 'pixi.js'
import gsap from 'gsap'
import { Match } from '../objects/Match'
import { gameApp } from '../GameApp'
import { MATCH_CONFIG } from '../../data/config'

export class MatchScene extends Container {
  roomBg: Sprite
  matchbox: Sprite
  match: Match
  private flame: Sprite
  private flameBlur: Sprite

  private isDragging = false
  private dragStartPos = { x: 0, y: 0 }
  private dragDistance = 0
  private ignited = false
  private sceneW = 1920
  private sceneH = 1080
  private matchHome = { x: 0, y: 0 }

  onIgnited?: () => void
  onTransitionDone?: () => void

  private _onDomDown: ((e: PointerEvent) => void) | null = null
  private _onDomMove: ((e: PointerEvent) => void) | null = null
  private _onDomUp: (() => void) | null = null

  constructor(bgTexture: Texture, matchBodyTexture: Texture, matchboxTexture: Texture, flameTexture: Texture) {
    super()
    this.sortableChildren = true

    // 背景
    this.roomBg = new Sprite(bgTexture)
    this.roomBg.zIndex = 0
    this.addChild(this.roomBg)

    // 火柴盒
    this.matchbox = new Sprite(matchboxTexture)
    this.matchbox.anchor.set(0.5)
    this.matchbox.zIndex = 1
    this.addChild(this.matchbox)

    // 火柴
    this.match = new Match(matchBodyTexture)
    this.match.zIndex = 3
    this.match.cursor = 'grab'
    this.addChild(this.match)

    // 火焰高斯模糊辉光层
    this.flameBlur = new Sprite(flameTexture)
    this.flameBlur.anchor.set(0.5, 1)
    this.flameBlur.tint = 0xffb03a
    this.flameBlur.alpha = 0
    this.flameBlur.zIndex = 3
    this.flameBlur.filters = [new BlurFilter({ strength: 8 })]
    this.addChild(this.flameBlur)

    // 火焰本体
    this.flame = new Sprite(flameTexture)
    this.flame.anchor.set(0.5, 1)
    this.flame.alpha = 0
    this.flame.zIndex = 4
    this.addChild(this.flame)

    this._onDomDown = (e: PointerEvent) => this.onMatchDown(e)
    this._onDomMove = (e: PointerEvent) => this.onMatchMove(e)
    this._onDomUp = () => this.onMatchUp()
  }

  init(width: number, height: number): void {
    this.sceneW = width
    this.sceneH = height

    // 背景居中 cover
    this.roomBg.anchor.set(0.5)
    this.roomBg.x = width / 2
    this.roomBg.y = height / 2
    const texW = this.roomBg.texture.width || width
    const texH = this.roomBg.texture.height || height
    this.roomBg.scale.set(Math.max(width / texW, height / texH))

    // 火柴盒 — 位置/大小从配置读取
    const mbTexW = this.matchbox.texture.width || 400
    const mbTexH = this.matchbox.texture.height || 200
    const mbScale = Math.min(
      width * MATCH_CONFIG.matchboxWidthRatio / mbTexW,
      MATCH_CONFIG.matchboxMaxScale,
    )
    this.matchbox.scale.set(mbScale)
    this.matchbox.x = width * MATCH_CONFIG.matchboxX
    this.matchbox.y = height * MATCH_CONFIG.matchboxY
    this.matchbox.rotation = MATCH_CONFIG.matchboxRotation

    // 火柴初始位置 — 相对火柴盒偏移
    this.matchHome = {
      x: this.matchbox.x + mbTexW * mbScale * MATCH_CONFIG.matchOffsetX,
      y: this.matchbox.y + mbTexH * mbScale * MATCH_CONFIG.matchOffsetY,
    }
    this.match.show(this.matchHome.x, this.matchHome.y)
    this.match.rotation = MATCH_CONFIG.matchRotation
    this.updateFlamePosition()

    this.ignited = false
    this.isDragging = false

    const canvas = gameApp.app.canvas
    canvas.addEventListener('pointerdown', this._onDomDown!)
    canvas.addEventListener('pointermove', this._onDomMove!)
    canvas.addEventListener('pointerup', this._onDomUp!)
  }

  private onMatchDown(e: PointerEvent): void {
    if (this.ignited || !this.hitTestMatch(e.clientX, e.clientY)) return
    this.isDragging = true
    this.dragDistance = 0
    this.dragStartPos = { x: e.clientX, y: e.clientY }
    this.match.cursor = 'grabbing'
  }

  /** 火焰 + 辉光跟随火柴头顶部 */
  private updateFlamePosition(): void {
    const head = this.match.getHeadPosition()
    const fx = head.x + MATCH_CONFIG.flameOffsetX
    const fy = head.y + MATCH_CONFIG.flameOffsetY
    this.flame.x = fx
    this.flame.y = fy
    this.flameBlur.x = fx
    this.flameBlur.y = fy
  }

  private onMatchMove(e: PointerEvent): void {
    if (!this.isDragging || this.ignited) return
    const x = e.clientX, y = e.clientY
    this.match.follow(x, y)
    this.updateFlamePosition()

    const dx = x - this.dragStartPos.x, dy = y - this.dragStartPos.y
    const speed = Math.sqrt(dx * dx + dy * dy)
    this.dragDistance += speed
    this.dragStartPos = { x, y }

    const inZone = this.isHeadInPhosphor()

    if (inZone && this.dragDistance >= MATCH_CONFIG.minDistance && speed >= MATCH_CONFIG.minSpeed) {
      this.fireIgnite()
    }
  }

  /** 火柴头上方 10% 是否在火柴盒下方 20% 磷片区域内 */
  private isHeadInPhosphor(): boolean {
    const m = this.match.getBounds()
    const b = this.matchbox.getBounds()

    // 火柴头：顶部的一小段
    const headX = m.x + m.width / 2
    const headY = m.y + m.height * MATCH_CONFIG.matchHeadRatio / 2

    // 磷片区：火柴盒底部
    const phosphorTop = b.y + b.height * (1 - MATCH_CONFIG.phosphorRatio)
    const phosphorBottom = b.y + b.height

    return (
      headX > b.x &&
      headX < b.x + b.width &&
      headY > phosphorTop &&
      headY < phosphorBottom
    )
  }

  private onMatchUp(): void {
    if (!this.isDragging) return
    this.isDragging = false
    this.match.cursor = 'grab'
    if (!this.ignited) {
      gsap.to(this.match, { x: this.matchHome.x, y: this.matchHome.y, rotation: MATCH_CONFIG.matchRotation, duration: 0.5, ease: 'power2.out' })
    }
  }

  private hitTestMatch(x: number, y: number): boolean {
    const b = this.match.getBounds()
    const pad = 20
    return x >= b.x - pad && x <= b.x + b.width + pad && y >= b.y - pad && y <= b.y + b.height + pad
  }

  private fireIgnite(): void {
    if (this.ignited) return
    this.ignited = true
    this.isDragging = false
    this.match.ignite()

    // 火焰出现 + 呼吸动画
    const s = MATCH_CONFIG.flameScale
    this.flame.alpha = 1
    this.flame.scale.set(s)
    gsap.to(this.flame.scale, {
      x: s * 1.1, y: s * 1.1, duration: 0.25, yoyo: true, repeat: -1, ease: 'sine.inOut',
    })

    // 高斯模糊辉光层
    this.flameBlur.alpha = 0.45
    this.flameBlur.scale.set(s * 1.2)
    gsap.to(this.flameBlur, {
      alpha: 0.25, duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut',
    })

    this.onIgnited?.()

    // 粒子爆发：从火焰位置向四周喷射
    this.burstParticles()

    // 火焰渐隐 + 过渡到下一阶段
    gsap.to(this.flame, { alpha: 0, duration: 0.4, delay: 0.8, overwrite: 'auto' })
    gsap.to(this.flameBlur, { alpha: 0, duration: 0.4, delay: 0.8, overwrite: 'auto' })
    gsap.delayedCall(1.5, () => this.onTransitionDone?.())
  }

  /** 粒子爆发：金色火星从火焰位置四散 */
  private burstParticles(): void {
    const cx = this.flame.x
    const cy = this.flame.y
    const count = 25

    for (let i = 0; i < count; i++) {
      const p = new Graphics()
      const r = 1.5 + Math.random() * 3.5
      p.circle(0, 0, r)
      p.fill({ color: 0xffb03a, alpha: 0.9 })
      p.x = cx
      p.y = cy
      p.zIndex = 10
      this.addChild(p)

      const angle = Math.random() * Math.PI * 2
      const dist = 150 + Math.random() * 400
      const duration = 0.8 + Math.random() * 0.8

      gsap.to(p, {
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        alpha: 0,
        duration,
        ease: 'power2.out',
        onComplete: () => {
          if (p.parent) p.parent.removeChild(p)
          p.destroy()
        },
      })
    }
  }

  /** 窗口 resize → 背景 & UI 重新居中 */
  onResize(w: number, h: number): void {
    this.sceneW = w
    this.sceneH = h
    const texW = this.roomBg.texture.width || w
    const texH = this.roomBg.texture.height || h
    this.roomBg.scale.set(Math.max(w / texW, h / texH))
    this.roomBg.x = w / 2
    this.roomBg.y = h / 2

    const mbTexW = this.matchbox.texture.width || 400
    const mbTexH = this.matchbox.texture.height || 200
    const mbScale = Math.min(w * MATCH_CONFIG.matchboxWidthRatio / mbTexW, MATCH_CONFIG.matchboxMaxScale)
    this.matchbox.rotation = MATCH_CONFIG.matchboxRotation
    this.matchbox.scale.set(mbScale)
    this.matchbox.x = w * MATCH_CONFIG.matchboxX
    this.matchbox.y = h * MATCH_CONFIG.matchboxY

    this.matchHome = {
      x: this.matchbox.x + mbTexW * mbScale * MATCH_CONFIG.matchOffsetX,
      y: this.matchbox.y + mbTexH * mbScale * MATCH_CONFIG.matchOffsetY,
    }
    if (!this.isDragging && !this.ignited) {
      this.match.x = this.matchHome.x
      this.match.y = this.matchHome.y
      this.match.rotation = MATCH_CONFIG.matchRotation
    }
  }

  destroyScene(): void {
    const canvas = gameApp.app?.canvas
    if (canvas) {
      canvas.removeEventListener('pointerdown', this._onDomDown!)
      canvas.removeEventListener('pointermove', this._onDomMove!)
      canvas.removeEventListener('pointerup', this._onDomUp!)
    }
    gsap.killTweensOf(this.match)
    gsap.killTweensOf(this.flame)
    gsap.killTweensOf(this.flameBlur)
    this.destroy({ children: true })
  }
}
