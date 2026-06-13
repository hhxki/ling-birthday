// ============================================================
// MatchScene — 划火柴 + 汇聚心意（同一场景无缝衔接）
// ============================================================
import { Container, Sprite, Texture, BlurFilter, Text, TextStyle } from 'pixi.js'
import gsap from 'gsap'
import { Match } from '../objects/Match'
import { FireParticle } from '../objects/FireParticle'
import { AudioAnalyzer } from '../utils/audioAnalyzer'
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
  private hintText: Text
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
  onParticleCollected?: (blessingFrom: string) => void
  onAllCollected?: () => void
  onBlown?: () => void
  onMicDenied?: () => void
  onConfetti?: () => void

  // 蜡烛阶段
  private analyzer: AudioAnalyzer
  private blown = false
  private candleParticles: FireParticle[] = []

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

    // 暗室（底层）
    this.roomDark = new Sprite(darkTex)
    this.roomDark.zIndex = 0
    this.roomDark.alpha = 0
    this.addChild(this.roomDark)

    // 亮室（上层，通过 alpha 控制渐显）
    this.roomBright = new Sprite(brightTex)
    this.roomBright.zIndex = 1
    this.roomBright.alpha = 0
    this.addChild(this.roomBright)

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

    // 提示文字
    this.hintText = new Text({
      text: '滑动火柴',
      style: new TextStyle({
        fontFamily: 'system-ui, sans-serif',
        fontSize: 32,
        fontWeight: 'bold',
        fill: '#ffffff',
        letterSpacing: 8,
      }),
    })
    this.hintText.anchor.set(0.5)
    this.hintText.zIndex = 2
    this.hintText.alpha = 1
    this.addChild(this.hintText)

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

    this.analyzer = new AudioAnalyzer()

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

    // 提示文字定位在火柴盒下方
    this.hintText.x = this.matchbox.x + 80
    this.hintText.y = this.matchbox.y + mbTexH * mbScale / 2 + 120
    this.hintText.alpha = 1

    this.updateFlamePosition()

    this.ignited = false
    this.isDragging = false
    this.phase2 = false
    this.completed = false
    this.brightStep = 0

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
    // 隐藏提示文字
    if (this.hintText.alpha > 0) {
      gsap.to(this.hintText, { alpha: 0, y: this.hintText.y + 20, duration: 0.4, ease: 'power2.out' })
    }
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
        rotation: MATCH_CONFIG.matchRotation, duration: 0.5, ease: 'power3.out',
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

  // ============ 点燃 → 火柴盒消失 → 居中 → 爆开 → 萤火虫 ============

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
    this.updateFlamePosition()

    this.onIgnited?.()

    // 1. 先隐藏火柴盒
    gsap.to(this.matchbox, { alpha: 0, duration: 0.4 })

    // 2. 火柴居中 + 背景切换同时进行
    const body = this.match.body
    const anchorX = 0.3, anchorY = 0.9
    const visualCenterOffsetX = (0.5 - anchorX) * body.width * body.scale.x
    const visualCenterOffsetY = (0.5 - anchorY) * body.height * body.scale.y
    const cx = this.sceneW / 2 - visualCenterOffsetX
    const cy = this.sceneH * 0.5 - visualCenterOffsetY
    gsap.to(this.match, {
      x: cx, y: cy, duration: 0.8, delay: 0.5, ease: 'power3.inOut',
      onUpdate: () => this.updateFlamePosition(),
      onComplete: () => this.burstAndSpawn(),
    })
    // 背景交叉渐变：从居中开始，覆盖到粒子爆开+沉降结束
    gsap.to(this.matchBg, { alpha: 0, duration: 3.5, ease: 'power4.inOut' })
    gsap.to(this.roomDark, { alpha: 1, duration: 3.5, ease: 'power4.inOut' })
  }

  private burstAndSpawn(): void {
    const head = this.match.getHeadPosition()
    const cx = this.match.x
    const cy = head.y + MATCH_CONFIG.flameOffsetY

    // 火焰消失（先杀掉呼吸动画再 fade）
    gsap.killTweensOf(this.flame)
    gsap.killTweensOf(this.flameBlur)
    gsap.to(this.flame, { alpha: 0, duration: 0.25 })
    gsap.to(this.flameBlur, { alpha: 0, duration: 0.25 })

    // 火柴隐藏
    gsap.to(this.match, { alpha: 0, duration: 0.3 })

    // 从火焰位置爆出粒子
    const count = PARTICLE_CONFIG.fireflyCount
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = 250 + Math.random() * 450
      const tx = cx + Math.cos(angle) * dist
      const ty = cy + Math.sin(angle) * dist
      const margin = 60
      const settleX = margin + Math.random() * (this.sceneW - margin * 2)
      const settleY = margin + Math.random() * (this.sceneH - margin * 2)

      const state: FireflyState = {
        id: `ff_${++this.idCounter}`,
        x: cx, y: cy,
        baseX: settleX, baseY: settleY,
        phase: Math.random() * Math.PI * 2,
        collected: false,
        blessingFrom: '',
      }
      const p = new FireParticle(this.particleTexture, state)
      p.zIndex = 7
      this.addChild(p)

      // 爆开飞出
      const dur1 = 0.5 + Math.random() * 0.5
      gsap.to(p, {
        x: tx, y: ty,
        duration: dur1,
        ease: 'power3.out',
        onComplete: () => {
          gsap.to(p, {
            x: settleX, y: settleY,
            duration: 1 + Math.random() * 1.5,
            ease: 'power3.inOut',
            onComplete: () => {
              p.data.baseX = settleX
              p.data.baseY = settleY
              ;(p as any)._settled = true
            },
          })
        },
      })
      ;(p as any)._settled = false

      p.on('pointerdown', () => this.collectFirefly(p))
      this.fireflies.push(p)
    }

    this.phase2 = true
  }

  // ============ 萤火虫收集 ============

  /** 在随机位置生成一只新萤火虫（补位用） */
  private spawnFirefly(x?: number, y?: number): void {
    const margin = 60
    const sx = x ?? (margin + Math.random() * (this.sceneW - margin * 2))
    const sy = y ?? (margin + Math.random() * (this.sceneH - margin * 2))

    const state: FireflyState = {
      id: `ff_${++this.idCounter}`,
      x: sx, y: sy,
      baseX: sx, baseY: sy,
      phase: Math.random() * Math.PI * 2,
      collected: false,
      blessingFrom: '',
    }
    const p = new FireParticle(this.particleTexture, state)
    p.x = sx
    p.y = sy
    p.zIndex = 7
    p.alpha = 0
    ;(p as any)._settled = true
    p.on('pointerdown', () => this.collectFirefly(p))
    this.addChild(p)
    this.fireflies.push(p)
    // 淡入
    gsap.to(p, { alpha: 1, duration: 0.5, ease: 'power2.out' })
  }

  private collectFirefly(particle: FireParticle): void {
    if (particle.data.collected || this.completed) return
    const blessingFrom = this.getRandomUnshown()
    if (!blessingFrom) { this.allDone(); return }

    particle.data.blessingFrom = blessingFrom
    this.shownBlessings.add(blessingFrom)

    const tx = this.sceneW * PARTICLE_CONFIG.candleX
    const ty = this.sceneH * PARTICLE_CONFIG.candleY
    particle.collectTo(tx, ty).then(() => {
      this.onParticleCollected?.(blessingFrom)
      const idx = this.fireflies.indexOf(particle)
      if (idx !== -1) this.fireflies.splice(idx, 1)
      if (particle.parent) particle.parent.removeChild(particle)
      particle.destroy()
      // 补位：始终维持 25 只在屏
      if (this.shownBlessings.size < totalBlessings) this.spawnFirefly()
      // 背景渐变延迟到卡片关闭时触发
      if (this.shownBlessings.size >= totalBlessings) this.allDone()
    })
  }

  private brightStep = 0 // 0/1/2/3/4

  /** 收集进度 → 房间暗渐隐 / 房间亮渐显（4段，每段有过移动画） */
  private updateRoomBright(): void {
    const progress = this.shownBlessings.size / totalBlessings
    let newStep = 0
    if (progress >= 0.8) newStep = 4
    else if (progress >= 0.6) newStep = 3
    else if (progress >= 0.4) newStep = 2
    else if (progress > 0) newStep = 1

    if (newStep <= this.brightStep) return
    this.brightStep = newStep

    const target = newStep === 4 ? 1.0
      : newStep === 3 ? 0.8
      : newStep === 2 ? 0.6
      : 0.4

    gsap.to(this.roomBright, {
      alpha: target, duration: 1.2, ease: 'power3.inOut',
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

    // 房间亮 100%，但不自动切场景 — 等最后一张贺卡关闭
    gsap.to(this.roomBright, {
      alpha: 1, duration: 1, ease: 'power3.inOut',
    })
  }

  // ============ 场景过渡动画 ============

  /** 淡出剩余萤火虫（过渡到下一阶段前调用），返回 Promise */
  fadeOutScene(): Promise<void> {
    return new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve })
      // 剩余萤火虫逐个淡出
      this.fireflies.forEach((ff, i) => {
        tl.to(ff, { alpha: 0, duration: 0.25, ease: 'power2.in' }, i * 0.03)
      })
    })
  }

  // ============ 蜡烛阶段 ============

  /** 进入蜡烛阶段：房间保持亮起，启动麦克风 */
  async startCandlePhase(): Promise<void> {
    if (this.roomDark) this.roomDark.alpha = 0

    await new Promise(r => setTimeout(r, 300))
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
      this.candleParticles.push(p)

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

    // 彩带从顶部洒落
    this.onConfetti?.()

    gsap.delayedCall(1.5, () => this.onBlown?.())
  }

  stopMic(): void { this.analyzer.stop() }

  // ============ 萤火虫交互开关 ============

  /** 卡片关闭时触发 → 背景渐变；全部收集完后关闭卡片则触发下一阶段 */
  onCardClosed(): void {
    this.updateRoomBright()
    if (this.completed) {
      gsap.delayedCall(0.5, () => this.onAllCollected?.())
    }
  }

  setInteractive(active: boolean): void {
    this.fireflies.forEach((ff) => {
      ff.eventMode = active ? 'static' : 'none'
      ff.cursor = active ? 'pointer' : 'inherit'
    })
  }

  updateFireflies(delta: number): void {
    for (const ff of this.fireflies) {
      if (!ff.data.collected && (ff as any)._settled) ff.update(delta)
    }
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
      // 重置提示文字位置
      this.hintText.x = this.matchbox.x + 80
      this.hintText.y = this.matchbox.y + mbTexH * mbScale / 2 + 120
      this.hintText.alpha = 1
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
    this.analyzer.stop()
    gsap.killTweensOf(this.match)
    gsap.killTweensOf(this.flame)
    gsap.killTweensOf(this.flameBlur)
    gsap.killTweensOf(this.hintText)
    gsap.killTweensOf(this.matchBg)
    gsap.killTweensOf(this.roomDark)
    gsap.killTweensOf(this.roomBright)
    this.fireflies = []
    for (const p of this.candleParticles) {
      gsap.killTweensOf(p)
      if (p.parent) p.parent.removeChild(p)
      p.destroy()
    }
    this.candleParticles = []
    this.destroy({ children: true })
  }
}
