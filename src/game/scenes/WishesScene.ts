// ============================================================
// WishesScene — Stage 2: 汇聚心意
// ============================================================
import { Container, Sprite, Texture } from 'pixi.js'
import { FireParticle } from '../objects/FireParticle'
import { Candle } from '../objects/Candle'
import { PARTICLE_CONFIG } from '../../data/config'
import { blessingsData, totalBlessings } from '../../data/blessings'
import type { FireflyState } from '../../types'

export class WishesScene extends Container {
  roomBg: Sprite
  candle!: Candle
  private particleTexture!: Texture
  private fireflies: FireParticle[] = []
  private shownBlessings = new Set<string>()
  private sceneW = 1920
  private sceneH = 1080
  private completed = false
  private idCounter = 0

  onParticleCollected?: (blessingId: string) => void
  onAllCollected?: () => void

  constructor() {
    super()
    this.sortableChildren = true
    this.roomBg = new Sprite(Texture.WHITE)
    this.roomBg.zIndex = 0
    this.addChild(this.roomBg)
  }

  init(roomTex: Texture, cakeTexture: Texture, particleTex: Texture, w: number, h: number): void {
    this.sceneW = w
    this.sceneH = h

    // 背景居中 cover
    this.roomBg.texture = roomTex
    this.roomBg.anchor.set(0.5)
    this.roomBg.x = this.sceneW / 2
    this.roomBg.y = this.sceneH / 2
    const texW = roomTex.width || this.sceneW
    const texH = roomTex.height || this.sceneH
    this.roomBg.scale.set(Math.max(this.sceneW / texW, this.sceneH / texH))

    // 蛋糕
    this.candle = new Candle(cakeTexture)
    this.candle.zIndex = 1
    this.candle.x = this.sceneW / 2
    this.candle.y = this.sceneH * 0.65
    this.addChild(this.candle)

    this.fireflies = []
    this.shownBlessings.clear()
    this.completed = false
    this.idCounter = 0
    this.particleTexture = particleTex
  }

  spawnFireflies(_cx: number, _cy: number): void {
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
    p.on('pointerdown', () => this.collect(p))
    this.addChild(p)
    this.fireflies.push(p)
    return p
  }

  private collect(particle: FireParticle): void {
    if (particle.data.collected || this.completed) return
    const blessingId = this.getRandomUnshown()
    if (!blessingId) { this.done(); return }

    particle.data.blessingId = blessingId
    this.shownBlessings.add(blessingId)

    const pos = this.candle.getGlobalPosition()
    particle.collectTo(pos.x, pos.y).then(() => {
      this.candle.addLight(1 / totalBlessings)
      this.onParticleCollected?.(blessingId)
      const idx = this.fireflies.indexOf(particle)
      if (idx !== -1) this.fireflies.splice(idx, 1)
      if (particle.parent) particle.parent.removeChild(particle)
      particle.destroy()
      this.spawnOne()
      if (this.shownBlessings.size >= totalBlessings) this.done()
    })
  }

  private getRandomUnshown(): string | null {
    const unshown = blessingsData.filter((b) => !this.shownBlessings.has(b.id))
    if (!unshown.length) return null
    return unshown[Math.floor(Math.random() * unshown.length)].id
  }

  private done(): void {
    if (this.completed) return
    this.completed = true
    this.fireflies.forEach((ff) => { ff.eventMode = 'none'; ff.cursor = 'inherit' })
    this.candle.igniteFull()
    this.onAllCollected?.()
  }

  setInteractive(active: boolean): void {
    this.fireflies.forEach((ff) => {
      ff.eventMode = active ? 'static' : 'none'
      ff.cursor = active ? 'pointer' : 'inherit'
    })
  }

  updateFireflies(delta: number): void {
    for (const ff of this.fireflies) if (!ff.data.collected) ff.update(delta)
  }

  onResize(w: number, h: number): void {
    this.sceneW = w
    this.sceneH = h
    const texW = this.roomBg.texture.width || w
    const texH = this.roomBg.texture.height || h
    this.roomBg.scale.set(Math.max(w / texW, h / texH))
    this.roomBg.x = w / 2
    this.roomBg.y = h / 2
    this.candle.x = w / 2
    this.candle.y = h * 0.65
  }

  destroyScene(): void {
    this.fireflies = []
    this.destroy({ children: true })
  }
}
