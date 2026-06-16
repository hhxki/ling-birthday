declare module 'howler' {
  export class Howl {
    constructor(options: {
      src: string[]
      html5?: boolean
      loop?: boolean
      volume?: number
      autoplay?: boolean
    })
    play(): number
    pause(): this
    stop(): this
    unload(): void
    playing(): boolean
    duration(): number
    seek(seek?: number): number
    volume(v?: number): number
    on(event: string, callback: () => void): this
  }

  export const Howler: {
    volume(v?: number): number
    ctx: AudioContext | null
  }
}
