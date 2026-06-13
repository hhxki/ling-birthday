<!-- App.vue — 根组件 -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Howler } from 'howler'
import { useGameState } from './composables/useGameState'
import { useAudio } from './composables/useAudio'
import { AUDIO_CONFIG } from './data/config'
import { BGM } from './data/audioAssets'
import StageMatch from './stages/StageMatch.vue'
// import StageTimeline from './stages/StageTimeline.vue' // 暂搁置
import StageEnding from './stages/StageEnding.vue'

const AUDIO_ON_ICON = 'https://webstatic.mihoyo.com/dora/biz/mihoyo-hk4e-concept-animation/2.0.11/images/audio-on.5e57c737.png'
const AUDIO_OFF_ICON = 'https://webstatic.mihoyo.com/dora/biz/mihoyo-hk4e-concept-animation/2.0.11/images/audio-off.89ea1960.png'

const { state } = useGameState()
const { playBGM, destroyAll } = useAudio()

const isMuted = ref(AUDIO_CONFIG.muted)
let bgmStarted = false

// 全局静音开关
if (AUDIO_CONFIG.muted) {
  Howler.volume(0)
}

function toggleMute() {
  isMuted.value = !isMuted.value
  Howler.volume(isMuted.value ? 0 : 1)
}

// 首次用户交互时启动 BGM（绕过浏览器自动播放限制）
function tryStartBGM() {
  if (bgmStarted) return
  bgmStarted = true
  playBGM(BGM.main, AUDIO_CONFIG.bgmVolume)
}

onMounted(() => {
  document.addEventListener('pointerdown', tryStartBGM, { once: true })
  // 兜底：点击事件也能触发
  document.addEventListener('click', tryStartBGM, { once: true })
})

// 全局统一 BGM，不切换

onUnmounted(() => {
  destroyAll()
})
</script>

<template>
    <!-- 静音按钮 -->
    <button class="fixed top-6 right-6 z-[150] cursor-pointer hover:scale-105 transition-transform" @click="toggleMute">
      <img :src="isMuted ? AUDIO_OFF_ICON : AUDIO_ON_ICON" alt="静音" class="w-9 h-9" />
    </button>
    <StageMatch v-if="state.currentStage === 'match'" key="match" />
    <!-- <StageTimeline v-else-if="state.currentStage === 'timeline'" key="timeline" /> 搁置 -->
    <StageEnding v-else-if="state.currentStage === 'ending'" key="ending" />
</template>
