<!-- StageLoading -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAssetLoader } from '../composables/useAssetLoader'
import { useGameState } from '../composables/useGameState'
import { CRITICAL_ASSETS } from '../data/config'
import LoadingScreen from '../components/LoadingScreen.vue'

const { errors, loadAssets } = useAssetLoader()
const { state, setLoadingProgress, goToStage } = useGameState()

const ready = ref(false)
const hasError = ref(false)

onMounted(async () => {
  try {
    await loadAssets(CRITICAL_ASSETS)
    if (errors.value.length > 0) {
      console.warn('[StageLoading] errors:', errors.value)
      hasError.value = true
    }
  } catch (e) {
    console.error('[StageLoading] fatal:', e)
    hasError.value = true
  }
  setLoadingProgress(100)
  ready.value = true
})

function handleStart() {
  if (ready.value) goToStage('match')
}
</script>

<template>
  <div class="fixed inset-0 z-50" :class="{ 'cursor-pointer': ready }" @click="handleStart">
    <LoadingScreen :progress="state.loadingProgress" :error="hasError" />
  </div>
</template>
