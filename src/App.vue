<!-- App.vue — 根组件 -->
<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { Howler } from 'howler'
import { useGameState } from './composables/useGameState'
import { useAudio } from './composables/useAudio'
import { AUDIO_CONFIG } from './data/config'
import { BGM } from './data/audioAssets'
import StageMatch from './stages/StageMatch.vue'
import StageBlowCandle from './stages/StageBlowCandle.vue'
// import StageTimeline from './stages/StageTimeline.vue' // 暂搁置
import StageEnding from './stages/StageEnding.vue'

const { state } = useGameState()
const { playBGM, destroyAll } = useAudio()

// 全局静音开关
if (AUDIO_CONFIG.muted) {
  Howler.volume(0)
}

// 启动全局 BGM（循环播放）
onMounted(() => {
  playBGM(BGM.main, AUDIO_CONFIG.bgmVolume)
})

// 按阶段切换 BGM（不需要可删除此 watch）
watch(() => state.currentStage, (stage) => {
  const track = stage === 'ending' ? BGM.ending
    : stage === 'blow-candle' ? BGM.candle
    : BGM.main
  playBGM(track, AUDIO_CONFIG.bgmVolume)
})

onUnmounted(() => {
  destroyAll()
})
</script>

<template>
    <StageMatch v-if="state.currentStage === 'match'" key="match" />
    <StageBlowCandle v-else-if="state.currentStage === 'blow-candle'" key="blow" />
    <!-- <StageTimeline v-else-if="state.currentStage === 'timeline'" key="timeline" /> 搁置 -->
    <StageEnding v-else-if="state.currentStage === 'ending'" key="ending" />
</template>
