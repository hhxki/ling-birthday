<!-- StageBlowCandle — 吹蜡烛 -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Assets, Texture } from 'pixi.js'
import { useGameState } from '../composables/useGameState'
import { gameApp } from '../game/GameApp'
import { CandleScene } from '../game/scenes/CandleScene'
import { BLOW_CONFIG } from '../data/config'

const { state, setMicStatus, nextStage } = useGameState()
const canvasContainer = ref<HTMLDivElement>()
const showFallbackBtn = ref(false)

let scene: CandleScene | null = null
let micTimeout: ReturnType<typeof setTimeout> | null = null

function getTex(alias: string): Texture {
  try { const tex = Assets.get<Texture>(alias); if (tex && tex !== Texture.WHITE) return tex } catch { /* */ }
  return Texture.WHITE
}

onMounted(async () => {
  await gameApp.init()
  if (canvasContainer.value) gameApp.mount(canvasContainer.value)

  scene = new CandleScene()
  const w = window.innerWidth, h = window.innerHeight
  scene.init(getTex('room-bright'), getTex('fire-particle'), w, h)

  scene.onBlown = () => setTimeout(() => nextStage(), 2500)
  scene.onMicDenied = () => { showFallbackBtn.value = true; setMicStatus('denied') }

  gameApp.setScene(scene)
  startMicWithTimeout()
})

onUnmounted(() => {
  if (micTimeout) clearTimeout(micTimeout)
  scene?.stopMic()
  scene?.destroyScene()
})

async function startMicWithTimeout() {
  setMicStatus('requesting')
  micTimeout = setTimeout(() => {
    if (state.micStatus === 'requesting') { showFallbackBtn.value = true; setMicStatus('denied') }
  }, BLOW_CONFIG.micTimeout)
  await scene?.startMicListen()
  if (micTimeout) clearTimeout(micTimeout)
}

function manualBlow() { showFallbackBtn.value = false; scene?.blowOut() }
</script>

<template>
  <div ref="canvasContainer" class="fixed inset-0 z-5">
    <Transition name="fade">
      <div v-if="state.micStatus === 'requesting'" class="fixed bottom-15 left-1/2 -translate-x-1/2 z-60 flex items-center gap-3 px-4 sm:px-6 py-3 rounded-3xl bg-[#131a26]/75 backdrop-blur-xl border border-[#ffb03a]/30 max-w-[calc(100vw-2rem)]">
        <span class="w-3 h-3 rounded-full bg-[#ffb03a] animate-[micPulse_1s_ease-in-out_infinite] shrink-0" />
        <p class="m-0 text-xs sm:text-[13px] tracking-wider text-white/70 text-center">请允许麦克风访问，对着麦克风吹气吧</p>
      </div>
    </Transition>
    <Transition name="fade">
      <button v-if="showFallbackBtn" class="fixed bottom-20 left-1/2 -translate-x-1/2 z-60 flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-4 rounded-3xl border border-[#ffb03a]/40 bg-[#ffb03a]/12 text-[#ffb03a] text-[13px] sm:text-[15px] cursor-pointer transition-all duration-300 hover:bg-[#ffb03a]/25 hover:shadow-[0_0_32px_rgba(255,176,58,0.25)] max-w-[calc(100vw-2rem)]" @click="manualBlow">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 4C12 4 10 8 10 12C10 12 8 14 6 16C8 18 10 20 10 20C10 20 12 24 16 24S22 20 22 20C22 20 24 18 26 16C24 14 22 12 22 12C22 8 20 4 16 4Z" stroke="currentColor" stroke-width="1.5" /><path d="M16 14V20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
        <span>用手扇风（点击吹灭）</span>
      </button>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
@keyframes micPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 176, 58, 0.6); }
  50% { box-shadow: 0 0 0 12px rgba(255, 176, 58, 0); }
}
</style>
