<!-- StageMatch — 划火柴 -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Assets, Texture } from 'pixi.js'
import { useGameState } from '../composables/useGameState'
import { gameApp } from '../game/GameApp'
import { MatchScene } from '../game/scenes/MatchScene'
import { useAssetLoader } from '../composables/useAssetLoader'
import { CRITICAL_ASSETS } from '../data/config'

const { nextStage } = useGameState()
const canvasContainer = ref<HTMLDivElement>()

let scene: MatchScene | null = null

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

  const bgTex = getTex('match-bg')
  const bodyTex = getTex('match-body')
  const boxTex = getTex('matchbox')
  const flameTex = getTex('match-flame')

  scene = new MatchScene(bgTex, bodyTex, boxTex, flameTex)
  const { width, height } = gameApp.size
  scene.init(width, height)

  scene.onIgnited = () => {}
  scene.onTransitionDone = () => nextStage()

  gameApp.setScene(scene)
  gameApp.app.canvas.style.pointerEvents = 'auto'
})

onUnmounted(() => {
  gameApp.app.canvas.style.pointerEvents = 'none'
  scene?.destroyScene()
})
</script>

<template>
  <div ref="canvasContainer" class="fixed inset-0 z-5" />
</template>
