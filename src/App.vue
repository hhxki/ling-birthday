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
const { playBGM, isBGMPlaying, destroyAll } = useAudio()

const isMuted = ref(AUDIO_CONFIG.muted)

// 全局静音开关
if (AUDIO_CONFIG.muted) {
  Howler.volume(0)
}

function toggleMute() {
  isMuted.value = !isMuted.value
  Howler.volume(isMuted.value ? 0 : 1)
}

// ============================================================
// BGM 自动播放（绕过浏览器限制）
// 移动端硬性限制：HTMLMediaElement.play() 只在 touchend/click
// 中被浏览器放行，pointerdown/touchstart 不行。
//
// 策略：
//   1. pointerdown → 尝试播 BGM（桌面端直接成功，移动端被拦截）
//   2. BGM 真的播起来后，playBGM() 内部自动补播排队的 SFX
//   3. touchend → 移动端此时 BGM 一定能播，内部 flush 补上擦火声
//   4. 之后 isBGMPlaying()=true，所有音效即时播放
// ============================================================
let hasPreloaded = false
let lastBgmAttempt = 0

/** pointerdown/click: 尝试播放 BGM */
function preloadAudio() {
  if (isBGMPlaying()) return
  const now = Date.now()
  if (now - lastBgmAttempt < 800) return
  lastBgmAttempt = now

  if (!hasPreloaded) {
    playBGM(BGM.main, AUDIO_CONFIG.bgmVolume)
    hasPreloaded = true
    // 桌面端：此时 BGM 已播起，playBGM 内部 flush 了空队列
    // 移动端：BGM 被拦截，isBGMPlaying()=false，等 touchend 重试
  }
}

/** touchend: 移动端唯一可靠的音频播放时机 */
function handleTouchEnd() {
  if (isBGMPlaying()) return
  // 移动端 touchend 是可靠手势，BGM 一定播得起来
  // playBGM() 内部会补播排队的擦火声等 SFX
  playBGM(BGM.main, AUDIO_CONFIG.bgmVolume)
}

onMounted(() => {
  document.addEventListener('pointerdown', preloadAudio)
  document.addEventListener('click', preloadAudio)
  document.addEventListener('touchend', handleTouchEnd)
})

// 全局统一 BGM，不切换

onUnmounted(() => {
  destroyAll()
})
</script>

<template>
    <!-- 静音按钮 -->
    <button class="fixed z-[150] cursor-pointer hover:scale-105 transition-transform w-11 h-11 hidden sm:flex items-center justify-center" style="top: calc(1.5rem + var(--safe-inset-top)); right: calc(1.5rem + var(--safe-inset-right));" @click="toggleMute">
      <img :src="isMuted ? AUDIO_OFF_ICON : AUDIO_ON_ICON" alt="静音" class="w-9 h-9" />
    </button>
    <StageMatch v-if="state.currentStage === 'match'" key="match" />
    <!-- <StageTimeline v-else-if="state.currentStage === 'timeline'" key="timeline" /> 搁置 -->
    <StageEnding v-else-if="state.currentStage === 'ending'" key="ending" />
</template>
