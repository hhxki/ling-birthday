// ============================================================
// MatchScene — 划火柴 + 汇聚心意（同一场景无缝衔接）
// ============================================================
import { Container, Sprite, Texture, BlurFilter, Text, TextStyle } from 'pixi.js'
import gsap from 'gsap'
import { Match } from '../objects/Match'
import { FireParticle } from '../objects/FireParticle'
import { AudioAnalyzer } from '../utils/audioAnalyzer'
import { gameApp } from '../GameApp'
import { MATCH_CONFIG, PARTICLE_CONFIG, getMatchConfig } from '../../data/config'
import { blessingsData, totalBlessings } from '../../data/blessings'
import type { FireflyState } from '../../types'

export class MatchScene extends Container {
  private matchBg: Sprite
  private roomDark: Sprite
  private roomBright: Sprite
  matchbox: Sprite
  match: Match
  private flame: Sprite
  private flameBlur: Sprite
  private hintText: Text
  private fireflies: FireParticle[] = []
  private shownBlessings = new Set<string>()
  private particleTexture!: Texture
  private phase2 = false
  private completed = false
  private idCounter = 0

  private sceneW = 1920
  private sceneH = 1080
  private cfg = MATCH_CONFIG // 当前平台配置
  private matchHome = { x: 0, y: 0 }

  private isDragging = false
  private dragStartPos = { x: 0, y: 0 }
  private dragDistance = 0
  private ignited = false

  onIgnited?: () => void
  onParticleCollected?: (blessingFrom: string) => void
  onAllCollected?: () => void
  onBlown?: () => void
  onMicDenied?: () => void
  onConfetti?: () => void

  private analyzer: AudioAnalyzer
  private blown = false
  private candleParticles: FireParticle[] = []

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

    this.roomDark = new Sprite(darkTex); this.roomDark.zIndex = 0; this.roomDark.alpha = 0; this.addChild(this.roomDark)
    this.roomBright = new Sprite(brightTex); this.roomBright.zIndex = 1; this.roomBright.alpha = 0; this.addChild(this.roomBright)
    this.matchBg = new Sprite(matchBgTex); this.matchBg.zIndex = 2; this.addChild(this.matchBg)

    this.matchbox = new Sprite(boxTex); this.matchbox.anchor.set(0.5); this.matchbox.zIndex = 2; this.addChild(this.matchbox)
    this.match = new Match(bodyTex); this.match.zIndex = 4; this.match.cursor = 'grab'; this.addChild(this.match)

    this.hintText = new Text({ text: '滑动火柴', style: new TextStyle({ fontFamily: 'system-ui, sans-serif', fontSize: 32, fontWeight: 'bold', fill: '#ffffff', letterSpacing: 8 }) })
    this.hintText.anchor.set(0.5); this.hintText.zIndex = 2; this.hintText.alpha = 1; this.addChild(this.hintText)

    this.flameBlur = new Sprite(flameTex); this.flameBlur.anchor.set(0.5, 1); this.flameBlur.tint = 0xffb03a; this.flameBlur.alpha = 0; this.flameBlur.zIndex = 5
    this.flameBlur.filters = [new BlurFilter({ strength: 8 })]; this.addChild(this.flameBlur)

    this.flame = new Sprite(flameTex); this.flame.anchor.set(0.5, 1); this.flame.alpha = 0; this.flame.zIndex = 6; this.addChild(this.flame)

    this.analyzer = new AudioAnalyzer()
    this._onDomDown = (e: PointerEvent) => this.onMatchDown(e)
    this._onDomMove = (e: PointerEvent) => this.onMatchMove(e)
    this._onDomUp = () => this.onMatchUp()
  }

  // ============ 初始化 ============

  init(w: number, h: number): void {
    this.sceneW = w; this.sceneH = h
    this.cfg = getMatchConfig()

    const cover = (sprite: Sprite) => {
      sprite.anchor.set(0.5); sprite.x = w / 2; sprite.y = h / 2
      const tw = sprite.texture.width || w, th = sprite.texture.height || h
      sprite.scale.set(Math.max(w / tw, h / th))
    }
    cover(this.roomBright); cover(this.roomDark); cover(this.matchBg)
    this.matchBg.alpha = 1; this.roomDark.alpha = 0; this.roomBright.alpha = 0

    // 火柴盒（固定缩放）
    const mbTexW = this.matchbox.texture.width || 400
    const mbTexH = this.matchbox.texture.height || 200
    this.matchbox.scale.set(this.cfg.matchboxScale)
    this.matchbox.x = w * this.cfg.matchboxX
    this.matchbox.y = h * this.cfg.matchboxY
    this.matchbox.rotation = this.cfg.matchboxRotation

    this.matchHome = {
      x: this.matchbox.x + mbTexW * this.cfg.matchboxScale * this.cfg.matchOffsetX,
      y: this.matchbox.y + mbTexH * this.cfg.matchboxScale * this.cfg.matchOffsetY,
    }
    this.match.show(this.matchHome.x, this.matchHome.y)
    this.match.rotation = this.cfg.matchRotation
    this.match.setBodyScale(this.cfg.matchScale)
    this.syncFlameScale()

    this.hintText.x = this.matchbox.x + this.cfg.hintXOffset
    this.hintText.y = this.matchbox.y + mbTexH * this.cfg.matchboxScale / 2 + this.cfg.hintYOffset
    this.hintText.style.fontSize = this.cfg.hintFontSize
    this.hintText.alpha = 1

    this.updateFlamePosition()

    this.ignited = false; this.isDragging = false; this.phase2 = false; this.completed = false
    this.brightStep = 0

    const canvas = gameApp.app.canvas
    canvas.addEventListener('pointerdown', this._onDomDown!)
    canvas.addEventListener('pointermove', this._onDomMove!)
    canvas.addEventListener('pointerup', this._onDomUp!)
  }

  private get flameScaleMul(): number { return this.cfg.matchScale / MATCH_CONFIG.matchScale }
  private syncFlameScale(): void {
    const m = this.flameScaleMul
    this.flame.scale.set(this.cfg.flameScale * m)
    this.flameBlur.scale.set(this.cfg.flameScale * 1.2 * m)
    this.flameBlur.filters = [new BlurFilter({ strength: 8 * m })]
  }

  private updateFlamePosition(): void {
    const head = this.match.getHeadPosition()
    this.flame.x = head.x + this.cfg.flameOffsetX * this.flameScaleMul
    this.flame.y = head.y + this.cfg.flameOffsetY * this.flameScaleMul
    this.flameBlur.x = this.flame.x; this.flameBlur.y = this.flame.y
  }

  // ============ 拖动 ============

  private onMatchDown(e: PointerEvent): void {
    if (this.ignited || this.phase2) return
    if (!this.hitTestMatch(e.clientX, e.clientY)) return
    this.isDragging = true; this.dragDistance = 0
    this.dragStartPos = { x: e.clientX, y: e.clientY }
    this.match.cursor = 'grabbing'
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
    if (this.isHeadInPhosphor() && this.dragDistance >= this.cfg.minDistance && speed >= this.cfg.minSpeed) {
      this.fireIgnite()
    }
  }

  private onMatchUp(): void {
    if (!this.isDragging) return
    this.isDragging = false; this.match.cursor = 'grab'
    if (!this.ignited) {
      gsap.to(this.match, { x: this.matchHome.x, y: this.matchHome.y, rotation: this.cfg.matchRotation, duration: 0.5, ease: 'power3.out', onUpdate: () => this.updateFlamePosition() })
    }
  }

  private hitTestMatch(x: number, y: number): boolean {
    const b = this.match.getBounds(); const pad = 20
    return x >= b.x - pad && x <= b.x + b.width + pad && y >= b.y - pad && y <= b.y + b.height + pad
  }

  private isHeadInPhosphor(): boolean {
    const m = this.match.getBounds(); const b = this.matchbox.getBounds()
    const headX = m.x + m.width / 2; const headY = m.y + m.height * this.cfg.matchHeadRatio / 2
    const pTop = b.y + b.height * (1 - this.cfg.phosphorRatio)
    return headX > b.x && headX < b.x + b.width && headY > pTop && headY < b.y + b.height
  }

  // ============ 点燃 ============

  private fireIgnite(): void {
    if (this.ignited) return
    this.ignited = true; this.isDragging = false; this.match.ignite()
    this.updateFlamePosition()
    this.flame.alpha = 1
    const fs = this.flame.scale.x
    gsap.to(this.flame.scale, { x: fs * 1.1, y: fs * 1.1, duration: 0.25, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    this.flameBlur.alpha = 0.45
    gsap.to(this.flameBlur, { alpha: 0.25, duration: 0.5, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    this.onIgnited?.()
    gsap.to(this.matchbox, { alpha: 0, duration: 0.4 })

    const body = this.match.body
    const ax = 0.3, ay = 0.9
    const offX = (0.5 - ax) * body.width * body.scale.x
    const offY = (0.5 - ay) * body.height * body.scale.y
    gsap.to(this.match, {
      x: this.sceneW / 2 - offX, y: this.sceneH * 0.5 - offY, duration: 0.8, delay: 0.5, ease: 'power3.inOut',
      onUpdate: () => this.updateFlamePosition(),
      onComplete: () => this.burstAndSpawn(),
    })
    gsap.to(this.matchBg, { alpha: 0, duration: 3.5, ease: 'power4.inOut' })
    gsap.to(this.roomDark, { alpha: 1, duration: 3.5, ease: 'power4.inOut' })
  }

  private burstAndSpawn(): void {
    const head = this.match.getHeadPosition()
    const cx = head.x + this.cfg.flameOffsetX * this.flameScaleMul
    const cy = head.y + this.cfg.flameOffsetY * this.flameScaleMul
    gsap.killTweensOf(this.flame); gsap.killTweensOf(this.flameBlur)
    gsap.to(this.flame, { alpha: 0, duration: 0.25 })
    gsap.to(this.flameBlur, { alpha: 0, duration: 0.25 })
    gsap.to(this.match, { alpha: 0, duration: 0.3 })

    const count = PARTICLE_CONFIG.fireflyCount
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = this.cfg.burstDistMin + Math.random() * (this.cfg.burstDistMax - this.cfg.burstDistMin)
      const tx = cx + Math.cos(angle) * dist; const ty = cy + Math.sin(angle) * dist
      const m = this.cfg.fireflyMargin
      const sx = m + Math.random() * (this.sceneW - m * 2)
      const sy = m + Math.random() * (this.sceneH - m * 2)
      const state: FireflyState = { id: `ff_${++this.idCounter}`, x: cx, y: cy, baseX: sx, baseY: sy, phase: Math.random() * Math.PI * 2, collected: false, blessingFrom: '' }
      const p = new FireParticle(this.particleTexture, state); p.zIndex = 7; this.addChild(p)
      const d1 = 0.5 + Math.random() * 0.5
      gsap.to(p, { x: tx, y: ty, duration: d1, ease: 'power3.out', onComplete: () => {
        gsap.to(p, { x: sx, y: sy, duration: 1 + Math.random() * 1.5, ease: 'power3.inOut', onComplete: () => { p.data.baseX = sx; p.data.baseY = sy; (p as any)._settled = true } })
      }})
      ;(p as any)._settled = false
      p.on('pointerdown', () => this.collectFirefly(p))
      this.fireflies.push(p)
    }
    this.phase2 = true
  }

  // ============ 萤火虫 ============

  private spawnFirefly(x?: number, y?: number): void {
    const m = this.cfg.fireflyMargin
    const sx = x ?? (m + Math.random() * (this.sceneW - m * 2))
    const sy = y ?? (m + Math.random() * (this.sceneH - m * 2))
    const state: FireflyState = { id: `ff_${++this.idCounter}`, x: sx, y: sy, baseX: sx, baseY: sy, phase: Math.random() * Math.PI * 2, collected: false, blessingFrom: '' }
    const p = new FireParticle(this.particleTexture, state); p.x = sx; p.y = sy; p.zIndex = 7; p.alpha = 0
    ;(p as any)._settled = true
    p.on('pointerdown', () => this.collectFirefly(p))
    this.addChild(p); this.fireflies.push(p)
    gsap.to(p, { alpha: 1, duration: 0.5, ease: 'power2.out' })
  }

  private collectFirefly(particle: FireParticle): void {
    if (particle.data.collected || this.completed) return
    const bf = this.getRandomUnshown(); if (!bf) { this.allDone(); return }
    particle.data.blessingFrom = bf; this.shownBlessings.add(bf)
    particle.collectTo(this.sceneW * PARTICLE_CONFIG.candleX, this.sceneH * PARTICLE_CONFIG.candleY).then(() => {
      this.onParticleCollected?.(bf)
      const idx = this.fireflies.indexOf(particle); if (idx !== -1) this.fireflies.splice(idx, 1)
      if (particle.parent) particle.parent.removeChild(particle); particle.destroy()
      if (this.shownBlessings.size < totalBlessings) this.spawnFirefly()
      if (this.shownBlessings.size >= totalBlessings) this.allDone()
    })
  }

  private brightStep = 0
  private updateRoomBright(): void {
    const p = this.shownBlessings.size / totalBlessings
    let ns = 0
    if (p >= 0.8) ns = 4; else if (p >= 0.6) ns = 3; else if (p >= 0.4) ns = 2; else if (p > 0) ns = 1
    if (ns <= this.brightStep) return; this.brightStep = ns
    gsap.to(this.roomBright, { alpha: ns === 4 ? 1 : ns === 3 ? 0.8 : ns === 2 ? 0.6 : 0.4, duration: 1.2, ease: 'power3.inOut' })
  }
  private getRandomUnshown(): string | null {
    const u = blessingsData.filter(b => !this.shownBlessings.has(b.id)); return u.length ? u[Math.floor(Math.random() * u.length)].id : null
  }
  private allDone(): void {
    if (this.completed) return; this.completed = true
    this.fireflies.forEach(ff => { ff.eventMode = 'none'; ff.cursor = 'inherit' })
    gsap.to(this.roomBright, { alpha: 1, duration: 1, ease: 'power3.inOut' })
  }

  fadeOutScene(): Promise<void> {
    return new Promise(resolve => {
      const tl = gsap.timeline({ onComplete: resolve })
      this.fireflies.forEach((ff, i) => tl.to(ff, { alpha: 0, duration: 0.25, ease: 'power2.in' }, i * 0.03))
    })
  }

  async startCandlePhase(): Promise<void> {
    if (this.roomDark) this.roomDark.alpha = 0
    await new Promise(r => setTimeout(r, 300))
    const result = await this.analyzer.start((_v, isBlowing) => { if (isBlowing && !this.blown) this.blowOut() })
    if (result === 'denied') this.onMicDenied?.()
  }

  blowOut(): void {
    if (this.blown) return; this.blown = true
    const cx = this.sceneW * PARTICLE_CONFIG.candleX; const cy = this.sceneH * PARTICLE_CONFIG.candleY
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = this.cfg.blowDistMin + Math.random() * (this.cfg.blowDistMax - this.cfg.blowDistMin)
      const s: FireflyState = { id: `blow_${++this.idCounter}`, x: cx, y: cy, baseX: cx, baseY: cy, phase: Math.random() * Math.PI * 2, collected: true, blessingFrom: '' }
      const p = new FireParticle(this.particleTexture, s); p.alpha = 1; p.zIndex = 10; this.addChild(p); this.candleParticles.push(p)
      gsap.to(p, { x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist, alpha: 0, duration: 1.5 + Math.random() * 1.5, ease: 'power3.out', onComplete: () => { if (p.parent) p.parent.removeChild(p); p.destroy() } })
    }
    this.onConfetti?.(); gsap.delayedCall(1.5, () => this.onBlown?.())
  }

  stopMic(): void { this.analyzer.stop() }
  onCardClosed(): void { this.updateRoomBright(); if (this.completed) gsap.delayedCall(0.5, () => this.onAllCollected?.()) }
  setInteractive(a: boolean): void { this.fireflies.forEach(ff => { ff.eventMode = a ? 'static' : 'none'; ff.cursor = a ? 'pointer' : 'inherit' }) }
  updateFireflies(d: number): void { for (const ff of this.fireflies) { if (!ff.data.collected && (ff as any)._settled) ff.update(d) } }

  // ============ Resize ============

  onResize(w: number, h: number): void {
    this.sceneW = w; this.sceneH = h
    this.cfg = getMatchConfig()
    const reCover = (sprite: Sprite) => { sprite.anchor.set(0.5); sprite.x = w / 2; sprite.y = h / 2; const tw = sprite.texture.width || w, th = sprite.texture.height || h; sprite.scale.set(Math.max(w / tw, h / th)) }
    reCover(this.roomBright); reCover(this.roomDark); reCover(this.matchBg)
    const mbTexW = this.matchbox.texture.width || 400; const mbTexH = this.matchbox.texture.height || 200
    this.matchbox.scale.set(this.cfg.matchboxScale); this.matchbox.x = w * this.cfg.matchboxX; this.matchbox.y = h * this.cfg.matchboxY; this.matchbox.rotation = this.cfg.matchboxRotation
    this.matchHome = { x: this.matchbox.x + mbTexW * this.cfg.matchboxScale * this.cfg.matchOffsetX, y: this.matchbox.y + mbTexH * this.cfg.matchboxScale * this.cfg.matchOffsetY }
    this.match.setBodyScale(this.cfg.matchScale); this.syncFlameScale()
    if (!this.isDragging && !this.ignited) {
      this.match.x = this.matchHome.x; this.match.y = this.matchHome.y
      this.hintText.x = this.matchbox.x + this.cfg.hintXOffset; this.hintText.y = this.matchbox.y + mbTexH * this.cfg.matchboxScale / 2 + this.cfg.hintYOffset
      this.hintText.style.fontSize = this.cfg.hintFontSize; this.hintText.alpha = 1
    }
    this.updateFlamePosition()
  }

  // ============ 销毁 ============

  destroyScene(): void {
    const canvas = gameApp.app?.canvas
    if (canvas) { canvas.removeEventListener('pointerdown', this._onDomDown!); canvas.removeEventListener('pointermove', this._onDomMove!); canvas.removeEventListener('pointerup', this._onDomUp!) }
    this.analyzer.stop()
    gsap.killTweensOf(this.match); gsap.killTweensOf(this.flame); gsap.killTweensOf(this.flameBlur)
    gsap.killTweensOf(this.hintText); gsap.killTweensOf(this.matchBg); gsap.killTweensOf(this.roomDark); gsap.killTweensOf(this.roomBright)
    for (const p of this.fireflies) { gsap.killTweensOf(p); if (p.parent) p.parent.removeChild(p); p.destroy() }
    this.fireflies = []
    for (const p of this.candleParticles) { gsap.killTweensOf(p); if (p.parent) p.parent.removeChild(p); p.destroy() }
    this.candleParticles = []
    this.destroy({ children: true })
  }
}
