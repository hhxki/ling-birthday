// ============================================================
// WishesScene — Stage 2: 汇聚心意
// ============================================================
import { Container, Sprite, Texture } from 'pixi.js'
import gsap from 'gsap'
import { FireParticle } from '../objects/FireParticle'
import { PARTICLE_CONFIG, getMatchConfig } from '../../data/config'
import { blessingsData, totalBlessings } from '../../data/blessings'
import type { FireflyState } from '../../types'

export class WishesScene extends Container {
  private roomDark: Sprite
  private roomBright: Sprite
  private particleTexture!: Texture
  private fireflies: FireParticle[] = []
  private shownBlessings = new Set<string>()
  private sceneW = 1920
  private sceneH = 1080
  private completed = false
  private idCounter = 0
  private cfg = getMatchConfig()

  onParticleCollected?: (blessingFrom: string) => void
  onAllCollected?: () => void

  constructor() {
    super(); this.sortableChildren = true
    this.roomBright = new Sprite(Texture.WHITE); this.roomBright.zIndex = 0; this.roomBright.alpha = 0; this.addChild(this.roomBright)
    this.roomDark = new Sprite(Texture.WHITE); this.roomDark.zIndex = 1; this.addChild(this.roomDark)
  }

  init(roomDarkTex: Texture, roomBrightTex: Texture, particleTex: Texture, w: number, h: number): void {
    this.sceneW = w; this.sceneH = h
    this.cfg = getMatchConfig()
    const cover = (sprite: Sprite, tex: Texture) => { sprite.texture = tex; sprite.anchor.set(0.5); sprite.x = w / 2; sprite.y = h / 2; const tw = tex.width || w, th = tex.height || h; sprite.scale.set(Math.max(w / tw, h / th)) }
    cover(this.roomBright, roomBrightTex); cover(this.roomDark, roomDarkTex)
    this.roomDark.alpha = 1; this.roomBright.alpha = 0
    this.fireflies = []; this.shownBlessings.clear(); this.completed = false; this.idCounter = 0
    this.particleTexture = particleTex
  }

  spawnFireflies(_cx: number, _cy: number): void { for (let i = 0; i < PARTICLE_CONFIG.fireflyCount; i++) this.spawnOne() }

  private spawnOne(): FireParticle {
    const m = this.cfg.fireflyMargin
    const sx = m + Math.random() * (this.sceneW - m * 2); const sy = m + Math.random() * (this.sceneH - m * 2)
    const state: FireflyState = { id: `ff_${++this.idCounter}`, x: sx, y: sy, baseX: sx, baseY: sy, phase: Math.random() * Math.PI * 2, collected: false, blessingFrom: '' }
    const p = new FireParticle(this.particleTexture, state); p.zIndex = 2
    p.on('pointerdown', () => this.collect(p)); this.addChild(p); this.fireflies.push(p)
    return p
  }

  private collect(particle: FireParticle): void {
    if (particle.data.collected || this.completed) return
    const bf = this.getRandomUnshown(); if (!bf) { this.done(); return }
    particle.data.blessingFrom = bf; this.shownBlessings.add(bf)
    particle.collectTo(this.sceneW / 2, this.sceneH * 0.65).then(() => {
      this.onParticleCollected?.(bf)
      const idx = this.fireflies.indexOf(particle); if (idx !== -1) this.fireflies.splice(idx, 1)
      if (particle.parent) particle.parent.removeChild(particle); particle.destroy()
      this.spawnOne()
      if (this.shownBlessings.size >= totalBlessings) this.done()
    })
  }

  private getRandomUnshown(): string | null { const u = blessingsData.filter(b => !this.shownBlessings.has(b.id)); return u.length ? u[Math.floor(Math.random() * u.length)].id : null }

  private done(): void {
    if (this.completed) return; this.completed = true
    this.fireflies.forEach(ff => { ff.eventMode = 'none'; ff.cursor = 'inherit' })
    gsap.to(this.roomDark, { alpha: 0, duration: 1.2, ease: 'power2.inOut' })
    gsap.to(this.roomBright, { alpha: 1, duration: 1.2, ease: 'power2.inOut', onComplete: () => gsap.delayedCall(0.8, () => this.onAllCollected?.()) })
  }

  setInteractive(a: boolean): void { this.fireflies.forEach(ff => { ff.eventMode = a ? 'static' : 'none'; ff.cursor = a ? 'pointer' : 'inherit' }) }
  updateFireflies(d: number): void { for (const ff of this.fireflies) if (!ff.data.collected) ff.update(d) }

  onResize(w: number, h: number): void {
    this.sceneW = w; this.sceneH = h; this.cfg = getMatchConfig()
    const reCover = (sprite: Sprite) => { const tex = sprite.texture; if (!tex || tex === Texture.WHITE) return; sprite.x = w / 2; sprite.y = h / 2; const tw = tex.width || w, th = tex.height || h; sprite.scale.set(Math.max(w / tw, h / th)) }
    reCover(this.roomDark); reCover(this.roomBright)
  }

  destroyScene(): void { gsap.killTweensOf(this.roomDark); gsap.killTweensOf(this.roomBright); this.fireflies = []; this.destroy({ children: true }) }
}
