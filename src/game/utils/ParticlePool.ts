// ============================================================
// ParticlePool — 粒子对象池
// 避免频繁 new/destroy 导致 GC 卡顿
// ============================================================
import { Container, Sprite, Texture } from 'pixi.js'

export class ParticlePool {
  private pool: Sprite[] = []
  private active: Sprite[] = []
  private texture: Texture

  constructor(texture: Texture, initialSize = 50) {
    this.texture = texture
    // 预创建粒子
    for (let i = 0; i < initialSize; i++) {
      const sprite = new Sprite(texture)
      sprite.alpha = 0
      sprite.visible = false
      sprite.eventMode = 'none'
      this.pool.push(sprite)
    }
  }

  /** 从池中获取一个粒子 */
  acquire(): Sprite {
    let sprite: Sprite
    if (this.pool.length > 0) {
      sprite = this.pool.pop()!
    } else {
      sprite = new Sprite(this.texture)
    }
    sprite.alpha = 1
    sprite.visible = true
    sprite.eventMode = 'static'
    sprite.cursor = 'pointer'
    this.active.push(sprite)
    return sprite
  }

  /** 回收一个粒子回池 */
  release(sprite: Sprite): void {
    const idx = this.active.indexOf(sprite)
    if (idx !== -1) {
      this.active.splice(idx, 1)
    }
    sprite.alpha = 0
    sprite.visible = false
    sprite.eventMode = 'none'
    sprite.cursor = 'inherit'
    // 清除可能残留的 GSAP tweens（由外部负责，这里只做基础清理）
    if (sprite.parent) {
      sprite.parent.removeChild(sprite)
    }
    this.pool.push(sprite)
  }

  /** 回收所有活跃粒子 */
  releaseAll(): void {
    while (this.active.length > 0) {
      this.release(this.active[0])
    }
  }

  /** 销毁整个池 */
  destroy(): void {
    this.releaseAll()
    for (const sprite of this.pool) {
      sprite.destroy()
    }
    this.pool = []
  }

  get activeCount(): number {
    return this.active.length
  }

  get poolSize(): number {
    return this.pool.length
  }
}
