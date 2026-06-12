// ============================================================
// MatchScene — 划火柴 + 汇聚心意（同一场景无缝衔接）
// ============================================================
import { Container, Sprite, Texture, Graphics, BlurFilter } from 'pixi.js'
import gsap from 'gsap'
import { Match } from '../objects/Match'
import { FireParticle } from '../objects/FireParticle'
import { gameApp } from '../GameApp'
import { MATCH_CONFIG, PARTICLE_CONFIG } from '../../data/config'
import { blessingsData, totalBlessings } from '../../data/blessings'
import type { FireflyState } from '../../types'

export class MatchScene extends Container {
  // 三层背景：火柴背景 → 房间暗 → 房间亮
  private matchBg: Sprite
  private roomDark: Sprite
  private roomBright: Sprite
  // 火柴阶段
  matchbox: Sprite
  match: Match
  private flame: Sprite
  private flameBlur: Sprite
  // 萤火虫阶段
  private fireflies: FireParticle[] = []
  private shownBlessings = new Set<string>()
  private particleTexture!: Texture
  private phase2 = false
  private completed = false
  private idCounter = 0

  // 尺寸
  private sceneW = 1920
  private sceneH = 1080
  private matchHome = { x: 0, y: 0 }

  // 拖动状态
  private isDragging = false
  private dragStartPos = { x: 0, y: 0 }
  private dragDistance = 0
  private ignited = false

  // 回调
  onIgnited?: () => void
  onParticleCollected?: (blessingId: string) => void
  onAllCollected?: () => void

  // DOM 事件
  private _onDomDown: ((e: PointerEvent) => void) | null = null
  private _onDomMove: ((e: PointerEvent) => void) | null = null
  private _onDomUp: (() => void) | null = null

  constructor(
    matchBgTex: Texture, darkTex: Texture, brightTex: Texture,
    bodyTex: Texture, boxTex: Texture, flameTex: Texture,
    particleTex: Texture,
  ) {
    super()
    this.sortableChildren = true
    this.particleTexture = particleTex

    // 亮室（最底层）
    this.roomBright = new Sprite(brightTex)
    this.roomBright.zIndex = 0
    this.roomBright.alpha = 0
    this.addChild(this.roomBright)

    // 暗室
    this.roomDark = new Sprite(darkTex)
    this.roomDark.zIndex = 1
    this.roomDark.alpha = 0
    this.addChild(this.roomDark)

    // 火柴背景（最上层，初始可见）
    this.matchBg = new Sprite(matchBgTex)
    this.matchBg.zIndex = 2
    this.addChild(this.matchBg)

    // 火柴盒
    this.matchbox = new Sprite(boxTex)
    this.matchbox.anchor.set(0.5)
    this.matchbox.zIndex = 2
    this.addChild(this.matchbox)

    // 火柴
    this.match = new Match(bodyTex)
    this.match.zIndex = 4
    this.match.cursor = 'grab'
    this.addChild(this.match)

    // 火焰辉光
    this.flameBlur = new Sprite(flameTex)
    this.flameBlur.anchor.set(0.5, 1)
    this.flameBlur.tint = 0xffb03a
    this.flameBlur.alpha = 0
    this.flameBlur.zIndex = 5
    this.flameBlur.filters = [new BlurFilter({ strength: 8 })]
    this.addChild(this.flameBlur)

    // 火焰
    this.flame = new Sprite(flameTex)
    this.flame.anchor.set(0.5, 1)
    this.flame.alpha = 0
    this.flame.zIndex = 6
    this.addChild(this.flame)

    this._onDomDown = (e: PointerEvent) => this.onMatchDown(e)
    this._onDomMove = (e: PointerEvent) => this.onMatchMove(e)
    this._onDomUp = () => this.onMatchUp()
  }

  // ============ 初始化 ============

  init(w: number, h: number): void {
    this.sceneW = w
    this.sceneH = h

    const cover = (sprite: Sprite) => {
      sprite.anchor.set(0.5)
      sprite.x = w / 2
      sprite.y = h / 2
      const tw = sprite.texture.width || w
      const th = sprite.texture.height || h
      sprite.scale.set(Math.max(w / tw, h / th))
    }
    cover(this.roomBright)
    cover(this.roomDark)
    cover(this.matchBg)
    // 初始只显示火柴背景
    this.matchBg.alpha = 1
    this.roomDark.alpha = 0
    this.roomBright.alpha = 0

    // 火柴盒
    const mbTexW = this.matchbox.texture.width || 400
    const mbTexH = this.matchbox.texture.height || 200
    const mbScale = Math.min(w * MATCH_CONFIG.matchboxWidthRatio / mbTexW, MATCH_CONFIG.matchboxMaxScale)
    this.matchbox.scale.set(mbScale)
    this.matchbox.x = w * MATCH_CONFIG.matchboxX
    this.matchbox.y = h * MATCH_CONFIG.matchboxY
    this.matchbox.rotation = MATCH_CONFIG.matchboxRotation

    this.matchHome = {
      x: this.matchbox.x + mbTexW * mbScale * MATCH_CONFIG.matchOffsetX,
      y: this.matchbox.y + mbTexH * mbScale * MATCH_CONFIG.matchOffsetY,
    }
    this.match.show(this.matchHome.x, this.matchHome.y)
    this.match.rotation = MATCH_CONFIG.matchRotation
    this.updateFlamePosition()

    this.ignited = false
    this.isDragging = false
    this.phase2 = false
    this.completed = false

    const canvas = gameApp.app.canvas
    canvas.addEventListener('pointerdown', this._onDomDown!)
    canvas.addEventListener('pointermove', this._onDomMove!)
    canvas.addEventListener('pointerup', this._onDomUp!)
  }

  // ============ 火柴拖动 ============

  private updateFlamePosition(): void {
    const head = this.match.getHeadPosition()
    const fx = head.x + MATCH_CONFIG.flameOffsetX
    const fy = head.y + MATCH_CONFIG.flameOffsetY
    this.flame.x = fx; this.flame.y = fy
    this.flameBlur.x = fx; this.flameBlur.y = fy
  }

  private onMatchDown(e: PointerEvent): void {
    if (this.ignited || this.phase2) return
    if (!this.hitTestMatch(e.clientX, e.clientY)) return
    this.isDragging = true
    this.dragDistance = 0
    this.dragStartPos = { x: e.clientX, y: e.clientY }
    this.match.cursor = 'grabbing'
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

    if (this.isHeadInPhosphor() && this.dragDistance >= MATCH_CONFIG.minDistance && speed >= MATCH_CONFIG.minSpeed) {
      this.fireIgnite()
    }
  }

  private onMatchUp(): void {
    if (!this.isDragging) return
    this.isDragging = false
    this.match.cursor = 'grab'
    if (!this.ignited) {
      gsap.to(this.match, {
        x: this.matchHome.x, y: this.matchHome.y,
        rotation: MATCH_CONFIG.matchRotation, duration: 0.5, ease: 'power2.out',
      })
    }
  }

  private hitTestMatch(x: number, y: number): boolean {
    const b = this.match.getBounds()
    const pad = 20
    return x >= b.x - pad && x <= b.x + b.width + pad &&
           y >= b.y - pad && y <= b.y + b.height + pad
  }

  private isHeadInPhosphor(): boolean {
    const m = this.match.getBounds()
    const b = this.matchbox.getBounds()
    const headX = m.x + m.width / 2
    const headY = m.y + m.height * MATCH_CONFIG.matchHeadRatio / 2
    const pTop = b.y + b.height * (1 - MATCH_CONFIG.phosphorRatio)
    return headX > b.x && headX < b.x + b.width && headY > pTop && headY < b.y + b.height
  }

  // ============ 点燃 → 粒子爆发 → 进入萤火虫阶段 ============

  private fireIgnite(): void {
    if (this.ignited) return
    this.ignited = true
    this.isDragging = false
    this.match.ignite()

    const s = MATCH_CONFIG.flameScale
    this.flame.alpha = 1
    this.flame.scale.set(s)
    gsap.to(this.flame.scale, { x: s * 1.1, y: s * 1.1, duration: 0.25, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    this.flameBlur.alpha = 0.45
    this.flameBlur.scale.set(s * 1.2)
    gsap.to(this.flameBlur, { alpha: 0.25, duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut' })

    this.onIgnited?.()
    this.burstParticles()
  }

  private burstParticles(): void {
    const cx = this.flame.x, cy = this.flame.y
    for (let i = 0; i < 25; i++) {
      const p = new Graphics()
      p.circle(0, 0, 1.5 + Math.random() * 3.5)
      p.fill({ color: 0xffb03a, alpha: 0.9 })
      p.x = cx; p.y = cy; p.zIndex = 10
      this.addChild(p)

      const angle = Math.random() * Math.PI * 2
      const dist = 150 + Math.random() * 400
      gsap.to(p, {
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        alpha: 0,
        duration: 0.8 + Math.random() * 0.8,
        ease: 'power2.out',
        onComplete: () => { if (p.parent) p.parent.removeChild(p); p.destroy() },
      })
    }

    // 爆发后进入萤火虫阶段
    gsap.delayedCall(1.5, () => this.startPhase2())
  }

  private startPhase2(): void {
    this.phase2 = true

    // 火焰消失
    gsap.to(this.flame, { alpha: 0, duration: 0.4, overwrite: 'auto' })
    gsap.to(this.flameBlur, { alpha: 0, duration: 0.4, overwrite: 'auto' })

    // 火柴背景 → 房间暗
    gsap.to(this.matchBg, { alpha: 0, duration: 1.2, ease: 'power2.inOut' })
    gsap.to(this.roomDark, { alpha: 1, duration: 1.2, ease: 'power2.inOut' })

    // 火柴隐藏
    gsap.to(this.match, { alpha: 0, duration: 0.5 })

    // 生成萤火虫
    this.spawnFireflies()
  }

  // ============ 萤火虫阶段 ============

  private spawnFireflies(): void {
    for (let i = 0; i < PARTICLE_CONFIG.fireflyCount; i++) this.spawnOne()
  }

  private spawnOne(): FireParticle {
    const margin = 60
    const sx = margin + Math.random() * (this.sceneW - margin * 2)
    const sy = margin + Math.random() * (this.sceneH - margin * 2)
    const state: FireflyState = {
      id: `ff_${++this.idCounter}`,
      x: sx, y: sy, baseX: sx, baseY: sy,
      phase: Math.random() * Math.PI * 2,
      collected: false, blessingId: '',
    }
    const p = new FireParticle(this.particleTexture, state)
    p.zIndex = 7
    p.on('pointerdown', () => this.collectFirefly(p))
    this.addChild(p)
    this.fireflies.push(p)
    return p
  }

  private collectFirefly(particle: FireParticle): void {
    if (particle.data.collected || this.completed) return
    const blessingId = this.getRandomUnshown()
    if (!blessingId) { this.allDone(); return }

    particle.data.blessingId = blessingId
    this.shownBlessings.add(blessingId)

    const tx = this.sceneW / 2
    const ty = this.sceneH * 0.65
    particle.collectTo(tx, ty).then(() => {
      this.onParticleCollected?.(blessingId)
      const idx = this.fireflies.indexOf(particle)
      if (idx !== -1) this.fireflies.splice(idx, 1)
      if (particle.parent) particle.parent.removeChild(particle)
      particle.destroy()
      this.spawnOne()
      if (this.shownBlessings.size >= totalBlessings) this.allDone()
    })
  }

  private getRandomUnshown(): string | null {
    const unshown = blessingsData.filter((b) => !this.shownBlessings.has(b.id))
    if (!unshown.length) return null
    return unshown[Math.floor(Math.random() * unshown.length)].id
  }

  private allDone(): void {
    if (this.completed) return
    this.completed = true
    this.fireflies.forEach((ff) => { ff.eventMode = 'none'; ff.cursor = 'inherit' })

    // 房间暗 → 房间亮
    gsap.to(this.roomDark, { alpha: 0, duration: 1.2, ease: 'power2.inOut' })
    gsap.to(this.roomBright, {
      alpha: 1, duration: 1.2, ease: 'power2.inOut',
      onComplete: () => {
        gsap.delayedCall(0.8, () => this.onAllCollected?.())
      },
    })
  }

  // ============ 萤火虫交互开关 ============

  setInteractive(active: boolean): void {
    this.fireflies.forEach((ff) => {
      ff.eventMode = active ? 'static' : 'none'
      ff.cursor = active ? 'pointer' : 'inherit'
    })
  }

  updateFireflies(delta: number): void {
    for (const ff of this.fireflies) if (!ff.data.collected) ff.update(delta)
  }

  // ============ Resize ============

  onResize(w: number, h: number): void {
    this.sceneW = w
    this.sceneH = h
    const reCover = (sprite: Sprite) => {
      sprite.x = w / 2; sprite.y = h / 2
      const tw = sprite.texture.width || w, th = sprite.texture.height || h
      sprite.scale.set(Math.max(w / tw, h / th))
    }
    reCover(this.roomBright)
    reCover(this.roomDark)
    reCover(this.matchBg)

    const mbTexW = this.matchbox.texture.width || 400
    const mbTexH = this.matchbox.texture.height || 200
    const mbScale = Math.min(w * MATCH_CONFIG.matchboxWidthRatio / mbTexW, MATCH_CONFIG.matchboxMaxScale)
    this.matchbox.scale.set(mbScale)
    this.matchbox.x = w * MATCH_CONFIG.matchboxX
    this.matchbox.y = h * MATCH_CONFIG.matchboxY
    this.matchbox.rotation = MATCH_CONFIG.matchboxRotation
    this.matchHome = {
      x: this.matchbox.x + mbTexW * mbScale * MATCH_CONFIG.matchOffsetX,
      y: this.matchbox.y + mbTexH * mbScale * MATCH_CONFIG.matchOffsetY,
    }
    if (!this.isDragging && !this.ignited) {
      this.match.x = this.matchHome.x
      this.match.y = this.matchHome.y
    }
  }

  // ============ 销毁 ============

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
    gsap.killTweensOf(this.matchBg)
    gsap.killTweensOf(this.roomDark)
    gsap.killTweensOf(this.roomBright)
    this.fireflies = []
    this.destroy({ children: true })
  }
}
