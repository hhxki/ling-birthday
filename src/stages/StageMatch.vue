<!-- StageMatch — 划火柴 + 汇聚心意 + 吹蜡烛（合并场景） -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Assets, Texture } from 'pixi.js'
import gsap from 'gsap'
import confetti from 'canvas-confetti'
import { useGameState } from '../composables/useGameState'
import { useAudio } from '../composables/useAudio'
import { gameApp } from '../game/GameApp'
import { MatchScene } from '../game/scenes/MatchScene'
import { useAssetLoader } from '../composables/useAssetLoader'
import { CRITICAL_ASSETS, AUDIO_CONFIG, BLOW_CONFIG } from '../data/config'
import { SFX } from '../data/audioAssets'
import GreetingCard from '../components/GreetingCard.vue'
import { blessingsData, totalBlessings } from '../data/blessings'
import type { Blessing } from '../types'

const { state, collectWish, nextStage, setTotalWishes, setMicStatus } = useGameState()
const { playSFX } = useAudio()
const canvasContainer = ref<HTMLDivElement>()

let scene: MatchScene | null = null
const activeCard = ref<Blessing | null>(null)
const showCounter = ref(false)
const counterEl = ref<HTMLDivElement>()
const showFallbackBtn = ref(false)
let micTimeout: ReturnType<typeof setTimeout> | null = null

function getTex(alias: string): Texture {
  try {
    const tex = Assets.get<Texture>(alias)
    if (tex && tex !== Texture.WHITE) return tex
  } catch { /* */ }
  return Texture.WHITE
}

onMounted(async () => {
  const { loadAssets } = useAssetLoader()
  try { await loadAssets(CRITICAL_ASSETS) } catch { /* */ }

  await gameApp.init()
  if (canvasContainer.value) gameApp.mount(canvasContainer.value)
  setTotalWishes(totalBlessings)

  const matchBgTex = getTex('match-bg')
  const darkTex = getTex('room-dark')
  const brightTex = getTex('room-bright')
  const bodyTex = getTex('match-body')
  const boxTex = getTex('matchbox')
  const flameTex = getTex('match-flame')
  const particleTex = getTex('fire-particle')

  scene = new MatchScene(matchBgTex, darkTex, brightTex, bodyTex, boxTex, flameTex, particleTex)
  const w = window.innerWidth, h = window.innerHeight
  scene.init(w, h)

  // 火柴点燃 → 火花爆开时显示计数器（与第二个界面同步）
  scene.onIgnited = () => { playSFX(SFX.matchStrike, AUDIO_CONFIG.sfxVolume); setTimeout(() => { showCounter.value = true }, 1300) }

  // 萤火虫收集 → 弹贺卡
  scene.onParticleCollected = (blessingFrom: string) => {
    const blessing = blessingsData.find((b) => b.id === blessingFrom)
    if (blessing) { activeCard.value = blessing; setFirefliesInteractive(false) }
    collectWish()
  }

  // 全部收集 → 计数器消失 + 萤火虫淡出 → 蜡烛阶段
  scene.onAllCollected = () => {
    animateCounterOut()
    scene?.fadeOutScene().then(() => startCandlePhase())
  }

  // 蜡烛吹灭 → 下一阶段
  scene.onBlown = () => setTimeout(() => nextStage(), 2500)

  // 麦克风被拒 → 显示手动按钮
  scene.onMicDenied = () => { showFallbackBtn.value = true; setMicStatus('denied') }

  // 吹灭蜡烛 → 彩带特效（自定义 canvas 确保在最上层）
  scene.onConfetti = () => {
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;'
    document.body.appendChild(canvas)
    const myConfetti = confetti.create(canvas, { resize: true, useWorker: false })

    const duration = 4000
    const end = Date.now() + duration
    const colors = ['#ff7b9f', '#ff69b4', '#fbbf24', '#ffd700', '#38bdf8', '#00bfff', '#ff6b6b', '#c084fc', '#ff9a9e', '#fad0c4']

    const frame = () => {
      myConfetti({
        particleCount: 5,
        angle: 60 + Math.random() * 60,
        spread: 60,
        origin: { x: Math.random(), y: -0.03 },
        colors,
        startVelocity: 55 + Math.random() * 35,
        gravity: 0.7,
        scalar: 0.8 + Math.random() * 0.6,
        drift: (Math.random() - 0.5) * 1.2,
        flat: false,
      })
      if (Date.now() < end) {
        requestAnimationFrame(frame)
      } else {
        setTimeout(() => { canvas.remove() }, 3000)
      }
    }
    frame()
  }

  gameApp.setScene(scene)
  gameApp.app.canvas.style.pointerEvents = 'auto'
  gameApp.app.ticker.add(updateFireflies)
})

onUnmounted(() => {
  if (micTimeout) clearTimeout(micTimeout)
  gameApp.app.ticker.remove(updateFireflies)
  gameApp.app.canvas.style.pointerEvents = 'none'
  scene?.destroyScene()
})

async function startCandlePhase() {
  setMicStatus('requesting')
  micTimeout = setTimeout(() => {
    if (state.micStatus === 'requesting') { showFallbackBtn.value = true; setMicStatus('denied') }
  }, BLOW_CONFIG.micTimeout)
  await scene?.startCandlePhase()
  if (micTimeout) clearTimeout(micTimeout)
}

function manualBlow() { showFallbackBtn.value = false; scene?.blowOut() }

function updateFireflies(ticker: { deltaTime: number }) {
  scene?.updateFireflies(ticker.deltaTime)
}

function setFirefliesInteractive(active: boolean) {
  scene?.setInteractive(active)
}

function closeCard() {
  activeCard.value = null
  setFirefliesInteractive(true)
  scene?.onCardClosed()
}

function animateCounterOut() {
  const el = counterEl.value
  if (!el) { showCounter.value = false; return }
  gsap.to(el, {
    opacity: 0,
    y: -6,
    scale: 0.93,
    duration: 0.4,
    ease: 'power2.in',
    onComplete: () => { showCounter.value = false },
  })
}

// 入场动画：showCounter 变为 true 后，等 DOM 渲染完用 GSAP 弹入
watch(showCounter, async (visible) => {
  if (!visible) return
  await nextTick()
  const el = counterEl.value
  if (!el) return
  gsap.fromTo(el,
    { opacity: 0, y: -10, scale: 0.9 },
    { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.4)' },
  )
})
</script>

<template>
  <div ref="canvasContainer" class="fixed inset-0 z-5">
    <!-- 汇聚心意 进度气泡（test.html 风格） -->
    <div v-if="showCounter" ref="counterEl" class="heart-counter-box fixed top-6 left-6 z-60 w-[238px] bg-white/95 backdrop-blur-md border-2 border-[#ff7b9f] rounded-2xl px-4 py-3 flex flex-col gap-2.5 select-none">
      <!-- 角落星星 -->
      <span class="star-sparkle absolute -top-2 -left-1.5 text-amber-300 text-sm">✦</span>
      <span class="star-sparkle absolute -bottom-1.5 -right-0.5 text-sky-400 text-xs" style="animation-delay: 0.5s;">✦</span>
      <!-- 头部 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <!-- 心意图标 -->
          <div class="relative w-5 h-5 bg-[#ff7b9f] rounded-full flex items-center justify-center text-white text-[8px] font-bold shadow-sm">
            ✚
            <span class="absolute inset-0 rounded-full bg-[#ff7b9f] opacity-20 animate-ping" />
          </div>
          <div class="flex flex-col">
            <span class="text-[7px] uppercase font-bold tracking-[0.15em] text-sky-400 leading-none mb-0.5">Hearts Gathering</span>
            <h2 class="text-xs font-black tracking-wide" style="background: linear-gradient(to right, #ff7b9f, #ff4b5c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">汇聚心意、</h2>
          </div>
        </div>
        <span class="text-[10px] text-[#ff7b9f]/40 font-mono tracking-widest animate-pulse font-bold">···</span>
      </div>
      <!-- 进度条 -->
      <div class="w-full relative">
        <div class="w-full h-2.5 bg-[#fff0f3] border border-pink-100/80 rounded-full overflow-hidden p-[1.5px] relative flex items-center" style="box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);">
          <div
            class="progress-fill h-full rounded-full relative transition-[width] duration-500 ease-out"
            style="background-image: linear-gradient(to right, #38bdf8, #ff7b9f, #ff4b5c); background-size: 206px 100%; background-repeat: no-repeat;"
            :style="{ width: (state.wishesCollected / totalBlessings) * 100 + '%' }"
          >
            <div class="absolute right-0 top-0 bottom-0 w-1.5 bg-white/60 blur-[1px] rounded-full" />
          </div>
        </div>
        <span class="absolute -top-3 text-xs" :style="{ left: (state.wishesCollected / totalBlessings) * 100 + '%', transform: 'translateX(-50%)' }"><span class="inline-block animate-bounce" style="animation-duration: 1.2s;">💖</span></span>
        <!-- 数字 -->
        <div class="flex justify-between mt-1.5">
          <span class="text-[10px] font-semibold text-[#ff7b9f]">{{ state.wishesCollected }} / {{ totalBlessings }}</span>
          <span class="text-[10px] text-[#ff7b9f]/50">{{ Math.round((state.wishesCollected / totalBlessings) * 100) }}%</span>
        </div>
      </div>
    </div>
    <GreetingCard v-if="activeCard" :blessing="activeCard" @close="closeCard" />

    <!-- 麦克风提示（test2.html 风格） -->
    <Transition name="fade">
      <div v-if="state.micStatus === 'requesting'" class="candle-prompt-box fixed bottom-15 left-1/2 -translate-x-1/2 z-60 flex items-center gap-4 bg-white/95 backdrop-blur-md border-2 border-[#ff7b9f] rounded-2xl px-5 py-3 select-none">
        <!-- 角落星星 -->
        <span class="star-sparkle absolute -top-2 -right-1 text-amber-300 text-base">✦</span>
        <span class="star-sparkle absolute -bottom-2 -left-1 text-sky-400 text-xs" style="animation-delay: 0.7s;">✦</span>
        <!-- 左侧：蜡烛图标 -->
        <div class="relative w-8 h-8 bg-[#fff0f3] border border-pink-100 rounded-xl flex flex-col items-center justify-end pb-1" style="box-shadow: inset 0 1px 2px rgba(0,0,0,0.04);">
          <span class="candle-flame text-sm absolute top-[-7px] text-amber-300 select-none">🔸</span>
          <div class="w-3 h-4 bg-gradient-to-b from-[#ff7b9f] to-[#ff4b5c] rounded-sm relative">
            <div class="absolute top-1 left-0 right-0 h-[1px] bg-white/40" />
            <div class="absolute top-2.5 left-0 right-0 h-[1px] bg-white/40" />
          </div>
          <span class="absolute inset-0 rounded-xl bg-amber-300/5 animate-ping" style="animation-duration: 2s;" />
        </div>
        <!-- 中间：文案 -->
        <div class="flex flex-col justify-center">
          <span class="text-[8px] uppercase font-bold tracking-[0.2em] text-sky-400 leading-none mb-0.5">Make a special wish</span>
          <h2 class="text-sm font-black tracking-wide" style="background: linear-gradient(to right, #ff7b9f, #ff4b5c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">请允许麦克风访问，对着麦克风吹气吧</h2>
        </div>
        <!-- 右侧：呼气引导 -->
        <div class="wind-puff flex items-center justify-center border-l border-pink-100 pl-3 h-6 text-base">
          <span>💨</span>
        </div>
      </div>
    </Transition>
    <!-- 手动吹灭按钮 -->
    <Transition name="fade">
      <button v-if="showFallbackBtn" class="fixed bottom-20 left-1/2 -translate-x-1/2 z-60 flex items-center gap-3 px-8 py-4 rounded-3xl border-2 border-[#ffb03a]/50 bg-[#1a1210]/90 backdrop-blur-md text-[#ffb03a] text-[15px] font-semibold tracking-wide cursor-pointer transition-all duration-300 shadow-[0_0_20px_rgba(255,176,58,0.15),0_0_40px_rgba(255,176,58,0.06)] hover:bg-[#241815] hover:border-[#ffb03a]/70 hover:shadow-[0_0_32px_rgba(255,176,58,0.3),0_0_60px_rgba(255,176,58,0.12)] active:scale-95" @click="manualBlow">
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
/* 蜡烛提示框 — test2.html 风格 */
.candle-prompt-box {
  animation: floatingAction 3s ease-in-out infinite;
  box-shadow: 0 15px 30px rgba(255, 123, 159, 0.12), inset 0 0 10px rgba(255, 255, 255, 0.8);
}
.candle-flame {
  animation: flameFlicker 0.6s ease-in-out infinite alternate;
  transform-origin: bottom center;
}
@keyframes flameFlicker {
  0% { transform: scale(0.9) rotate(-2deg); filter: drop-shadow(0 2px 4px rgba(251,191,36,0.5)); }
  100% { transform: scale(1.1) rotate(3deg); filter: drop-shadow(0 4px 8px rgba(251,191,36,0.8)); }
}
.wind-puff {
  animation: windBlow 1.6s ease-in-out infinite;
}
@keyframes windBlow {
  0% { transform: translateX(4px); opacity: 0.3; }
  50% { transform: translateX(-2px); opacity: 1; }
  100% { transform: translateX(4px); opacity: 0.3; }
}
/* 汇聚心意进度条 — test.html 风格 */
.heart-counter-box {
  animation: floatingAction 3s ease-in-out infinite;
  box-shadow: 0 15px 30px rgba(255, 123, 159, 0.12), inset 0 0 10px rgba(255, 255, 255, 0.6);
}
@keyframes floatingAction {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
/* 进度条填充层条纹覆层（不影响底层渐变） */
.progress-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image: repeating-linear-gradient(
    -45deg,
    rgba(255, 255, 255, 0.2) 0px,
    rgba(255, 255, 255, 0.2) 8px,
    transparent 8px,
    transparent 16px
  );
  background-size: 32px 32px;
  animation: stripeMove 1s linear infinite;
  pointer-events: none;
}
@keyframes stripeMove {
  0% { background-position: 0 0; }
  100% { background-position: 32px 0; }
}
.star-sparkle {
  animation: starBlink 1.5s infinite alternate ease-in-out;
}
@keyframes starBlink {
  0% { opacity: 0.3; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1.2); }
}
</style>
