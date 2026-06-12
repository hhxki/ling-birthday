// ============================================================
// GameApp — PixiJS Application 单例管理
// ============================================================
import { Application, Container } from 'pixi.js'

class GameApp {
  private static instance: GameApp | null = null

  app!: Application
  private mainContainer!: Container

  private constructor() {}

  static getInstance(): GameApp {
    if (!GameApp.instance) {
      GameApp.instance = new GameApp()
    }
    return GameApp.instance
  }

  /** 初始化 PixiJS Application */
  async init(): Promise<void> {
    if (this.app) return

    this.app = new Application()

    await this.app.init({
      resizeTo: window,
      resolution: Math.max(1, window.devicePixelRatio || 1),
      autoDensity: true,
      antialias: true,
      backgroundAlpha: 0, // 透明背景，让 DOM 层透出
    })

    // Canvas 样式：全屏覆盖，pointer-events 由子元素自行开启
    this.app.canvas.style.position = 'fixed'
    this.app.canvas.style.inset = '0'
    this.app.canvas.style.zIndex = '1'
    this.app.canvas.style.pointerEvents = 'none'

    this.mainContainer = new Container()
    this.mainContainer.label = 'main'
    this.app.stage.addChild(this.mainContainer)

    // resize 事件 + ResizeObserver 双保险
    window.addEventListener('resize', this.handleResize)
    this.resizeObserver = new ResizeObserver(() => this.notifyResize())
    this.resizeObserver.observe(document.body)
  }

  /** 挂载 Canvas 到 DOM */
  mount(parent: HTMLElement): void {
    parent.appendChild(this.app.canvas)
  }

  /** 获取主容器，Scene 挂载到这里 */
  get stage(): Container {
    return this.mainContainer
  }

  /** 清空当前场景 */
  clearScene(): void {
    this.mainContainer.removeChildren()
  }

  private currentScene: Container | null = null
  private resizeObserver: ResizeObserver | null = null

  /** 替换场景 */
  setScene(scene: Container): void {
    this.clearScene()
    this.mainContainer.addChild(scene)
    this.currentScene = scene
  }

  /** 获取渲染器尺寸 */
  get size(): { width: number; height: number } {
    return {
      width: this.app.renderer.width,
      height: this.app.renderer.height,
    }
  }

  /** 通知当前场景 resize */
  private notifyResize = (): void => {
    const w = window.innerWidth
    const h = window.innerHeight
    const scene = this.currentScene as any
    if (scene && typeof scene.onResize === 'function') {
      scene.onResize(w, h)
    }
  }

  private handleResize = (): void => {
    this.notifyResize()
  }

  /** 销毁 */
  destroy(): void {
    window.removeEventListener('resize', this.handleResize)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.app.destroy(true, { children: true })
    GameApp.instance = null
  }
}

export const gameApp = GameApp.getInstance()
