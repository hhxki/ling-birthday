<!-- App.vue — 根组件 -->
<script setup lang="ts">
import { useGameState } from './composables/useGameState'
import StageMatch from './stages/StageMatch.vue'
import StageBlowCandle from './stages/StageBlowCandle.vue'
import StageTimeline from './stages/StageTimeline.vue'
import StageEnding from './stages/StageEnding.vue'

const { state } = useGameState()
</script>

<template>
    <StageMatch v-if="state.currentStage === 'match'" key="match" />
    <StageBlowCandle v-else-if="state.currentStage === 'blow-candle'" key="blow" />
    <StageTimeline v-else-if="state.currentStage === 'timeline'" key="timeline" />
    <StageEnding v-else-if="state.currentStage === 'ending'" key="ending" />
</template>
