<!-- StageMatch — 划火柴 + 汇聚心意（合并场景） -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Assets, Texture } from 'pixi.js'
import { useGameState } from '../composables/useGameState'
import { gameApp } from '../game/GameApp'
import { MatchScene } from '../game/scenes/MatchScene'
import { useAssetLoader } from '../composables/useAssetLoader'
import { CRITICAL_ASSETS } from '../data/config'
import GreetingCard from '../components/GreetingCard.vue'
import { blessingsData, totalBlessings } from '../data/blessings'
import type { Blessing } from '../types'

const { state, collectWish, nextStage, setTotalWishes } = useGameState()
const canvasContainer = ref<HTMLDivElement>()

let scene: MatchScene | null = null
const activeCard = ref<Blessing | null>(null)
const showCounter = ref(false)

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

  // 火柴点燃 → 居中动画结束后显示计数器
  scene.onIgnited = () => { setTimeout(() => { showCounter.value = true }, 1500) }

  // 萤火虫收集 → 弹贺卡
  scene.onParticleCollected = (blessingFrom: string) => {
    const blessing = blessingsData.find((b) => b.id === blessingFrom)
    if (blessing) { activeCard.value = blessing; setFirefliesInteractive(false) }
    collectWish()
  }

  // 全部收集 → 下一阶段
  scene.onAllCollected = () => setTimeout(() => nextStage(), 2000)

  gameApp.setScene(scene)
  gameApp.app.canvas.style.pointerEvents = 'auto'
  gameApp.app.ticker.add(updateFireflies)
})

onUnmounted(() => {
  gameApp.app.ticker.remove(updateFireflies)
  gameApp.app.canvas.style.pointerEvents = 'none'
  scene?.destroyScene()
})

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
</script>

<template>
  <div ref="canvasContainer" class="fixed inset-0 z-5">
    <div v-if="showCounter" class="fixed top-6 right-6 z-60 flex items-center gap-2.5 px-4 py-2 rounded-2xl border border-[#ff7b9f]/20 bg-[#131a26]/70 backdrop-blur-xl">
      <span class="text-xs tracking-wider text-white/50">汇聚心意</span>
      <span class="text-sm font-semibold text-[#ff7b9f]">{{ state.wishesCollected }} / {{ totalBlessings }}</span>
    </div>
    <GreetingCard v-if="activeCard" :blessing="activeCard" @close="closeCard" />
  </div>
</template>
