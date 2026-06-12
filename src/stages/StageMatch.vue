<!-- StageMatch — 划火柴 + 汇聚心意（合并场景） -->
<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
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

// ===== 调试：首页直接展示贺卡方便调九宫格 =====
const showDebugCard = ref(true)
function closeDebugCard() { showDebugCard.value = false }

const debugBlessing = reactive<Blessing>({
  ...blessingsData[0],
  from: '无名的小粉丝',
  text: 'Ling生日快乐呀！虽然我只是直播间里一个小小的观众，但你的每次直播都能让我在疲惫的一天后露出笑容。谢谢你，要一直幸福下去！',
})

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

  // 火柴点燃
  scene.onIgnited = () => {}

  // 萤火虫收集 → 弹贺卡
  scene.onParticleCollected = (blessingId: string) => {
    const blessing = blessingsData.find((b) => b.id === blessingId)
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
    <div class="fixed top-6 right-6 z-60 flex items-center gap-2.5 px-4 py-2 rounded-2xl border border-[#ff7b9f]/20 bg-[#131a26]/70 backdrop-blur-xl">
      <span class="text-xs tracking-wider text-white/50">心意收集</span>
      <span class="text-sm font-semibold text-[#ff7b9f]">{{ state.wishesCollected }} / {{ totalBlessings }}</span>
    </div>
    <GreetingCard v-if="activeCard" :blessing="activeCard" @close="closeCard" />
    <!-- 调试：首页直接展示贺卡，方便调九宫格参数 -->
    <GreetingCard
      v-if="showDebugCard"
      :blessing="debugBlessing"
      @close="closeDebugCard"
    />

    <!-- 调试面板 -->
    <div class="fixed bottom-4 left-4 z-200 flex flex-col gap-2 p-3 rounded-xl bg-[#0b0f19]/85 backdrop-blur-md border border-white/10 text-xs text-white/70 w-64">
      <span class="text-[11px] tracking-wider text-white/40 uppercase">贺卡调试</span>
      <label class="flex flex-col gap-1">
        发送者
        <input v-model="debugBlessing.from" type="text" class="bg-white/10 border border-white/15 rounded px-2 py-1 text-white text-xs outline-none focus:border-[#ffb03a]/50" />
      </label>
      <label class="flex flex-col gap-1">
        祝福文字
        <textarea v-model="debugBlessing.text" rows="3" class="bg-white/10 border border-white/15 rounded px-2 py-1 text-white text-xs outline-none focus:border-[#ffb03a]/50 resize-none" />
      </label>
    </div>
  </div>
</template>
