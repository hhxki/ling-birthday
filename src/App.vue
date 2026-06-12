<!-- App.vue — 根组件 -->
<script setup lang="ts">
import { useGameState } from './composables/useGameState'
import StageMatch from './stages/StageMatch.vue'
import StageWishes from './stages/StageWishes.vue'
import StageBlowCandle from './stages/StageBlowCandle.vue'
import StageTimeline from './stages/StageTimeline.vue'
import StageEnding from './stages/StageEnding.vue'

const { state } = useGameState()
</script>

<template>
  <Transition name="stage" mode="out-in">
    <StageMatch v-if="state.currentStage === 'match'" key="match" />
    <StageWishes v-else-if="state.currentStage === 'wishes'" key="wishes" />
    <StageBlowCandle v-else-if="state.currentStage === 'blow-candle'" key="blow" />
    <StageTimeline v-else-if="state.currentStage === 'timeline'" key="timeline" />
    <StageEnding v-else-if="state.currentStage === 'ending'" key="ending" />
  </Transition>
</template>

<style>
.stage-enter-active,
.stage-leave-active {
  transition: opacity 0.6s ease;
}
.stage-enter-from,
.stage-leave-to {
  opacity: 0;
}
</style>
