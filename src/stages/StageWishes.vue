<!-- StageWishes — 汇聚心意 -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Assets, Texture } from 'pixi.js'
import { useGameState } from '../composables/useGameState'
import { gameApp } from '../game/GameApp'
import { WishesScene } from '../game/scenes/WishesScene'
import GreetingCard from '../components/GreetingCard.vue'
import { blessingsData, totalBlessings } from '../data/blessings'
import type { Blessing } from '../types'

const { state, collectWish, nextStage, setTotalWishes } = useGameState()
const canvasContainer = ref<HTMLDivElement>()

let scene: WishesScene | null = null
const activeCard = ref<Blessing | null>(null)

function getTex(alias: string): Texture {
  try { const tex = Assets.get<Texture>(alias); if (tex && tex !== Texture.WHITE) return tex } catch { /* */ }
  return Texture.WHITE
}

onMounted(async () => {
  await gameApp.init()
  if (canvasContainer.value) gameApp.mount(canvasContainer.value)
  setTotalWishes(totalBlessings)

  const roomTex = getTex('room-bright')
  const cakeTex = getTex('cake')
  const particleTex = getTex('fire-particle')

  scene = new WishesScene()
  const { width, height } = gameApp.size
  scene.init(roomTex, cakeTex, particleTex, width, height)

  scene.onParticleCollected = (blessingId: string) => {
    const blessing = blessingsData.find((b) => b.id === blessingId)
    if (blessing) { activeCard.value = blessing; setFirefliesInteractive(false) }
    collectWish()
  }

  scene.onAllCollected = () => setTimeout(() => nextStage(), 2000)

  gameApp.setScene(scene)
  gameApp.app.canvas.style.pointerEvents = 'auto'

  scene.spawnFireflies(width / 2, height / 2)
  gameApp.app.ticker.add(updateFireflies)
})

onUnmounted(() => {
  gameApp.app.ticker.remove(updateFireflies)
  gameApp.app.canvas.style.pointerEvents = 'none'
  scene?.destroyScene()
})

function updateFireflies(ticker: { deltaTime: number }) { scene?.updateFireflies(ticker.deltaTime) }
function setFirefliesInteractive(active: boolean) { scene?.setInteractive(active) }
function closeCard() { activeCard.value = null; setFirefliesInteractive(true) }
</script>

<template>
  <div ref="canvasContainer" class="fixed inset-0 z-5">
    <div class="fixed top-6 right-6 z-60 flex items-center gap-2.5 px-4 py-2 rounded-2xl border border-[#ff7b9f]/20 bg-[#131a26]/70 backdrop-blur-xl">
      <span class="text-xs tracking-wider text-white/50">心意收集</span>
      <span class="text-sm font-semibold text-[#ff7b9f]">{{ state.wishesCollected }} / {{ totalBlessings }}</span>
    </div>
    <GreetingCard v-if="activeCard" :blessing="activeCard" @close="closeCard" />
  </div>
</template>
