<!-- GreetingCard — 粉丝祝福贺卡 -->
<script setup lang="ts">
import { ref } from 'vue'
import type { Blessing } from '../types'
import { useAudio } from '../composables/useAudio'

const props = defineProps<{ blessing: Blessing }>()
const emit = defineEmits<{ close: [] }>()

const { playVoice } = useAudio()
const isPlaying = ref(false)
let currentVoice: ReturnType<typeof playVoice> | null = null

function handlePlayVoice() {
  if (!props.blessing.audioUrl) return
  if (isPlaying.value) {
    currentVoice?.stop()
    isPlaying.value = false
    return
  }
  currentVoice = playVoice(props.blessing.audioUrl)
  isPlaying.value = true
  currentVoice.on('end', () => { isPlaying.value = false })
}

const borderColor: Record<string, string> = {
  'classic-letter': 'border-[#ffb03a]/25',
  'cherry-blossom': 'border-[#ff7b9f]/35',
  'city-pop-vinyl': 'border-[#63b3ed]/30',
}
</script>

<template>
  <Transition name="card">
    <div
      class="fixed top-1/2 left-1/2 z-100 w-[min(420px,90vw)] px-7 pt-8 pb-6 rounded-2xl backdrop-blur-2xl border shadow-[0_24px_64px_rgba(0,0,0,0.5)]"
      :class="[
        borderColor[blessing.styleType] || 'border-[#ffb03a]/25',
        blessing.styleType === 'cherry-blossom' ? 'bg-[#1e0f19]/80' : '',
        blessing.styleType === 'city-pop-vinyl' ? 'bg-[#0f1423]/80' : '',
        !blessing.styleType || blessing.styleType === 'classic-letter' ? 'bg-[#131a26]/75' : '',
      ]"
      style="transform: translate(-50%, -50%)"
    >
      <!-- 关闭按钮 -->
      <button
        class="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white/8 text-white/60 cursor-pointer transition-all duration-200 hover:bg-white/15 hover:text-white border-none"
        @click="emit('close')"
        aria-label="关闭"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
      </button>

      <!-- 发送者 -->
      <p class="text-[13px] tracking-wider text-[#ff7b9f] m-0 mb-2">From: {{ blessing.from }}</p>

      <!-- 分割线 -->
      <div class="h-px mb-4" style="background: linear-gradient(to right, rgba(255,123,159,0.4), transparent 80%)" />

      <!-- 祝福文字 -->
      <p class="text-[15px] leading-relaxed text-white/85 m-0 mb-5">{{ blessing.text }}</p>

      <!-- 语音播放 -->
      <button
        v-if="blessing.audioUrl"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-[#ff7b9f]/30 bg-[#ff7b9f]/10 text-[#ff7b9f] text-[13px] cursor-pointer transition-all duration-200 hover:bg-[#ff7b9f]/20"
        :class="{ '!border-[#63b3ed]/40 !bg-[#63b3ed]/15 !text-[#63b3ed]': isPlaying }"
        @click="handlePlayVoice"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path v-if="!isPlaying" d="M8 5v14l11-7z" />
          <template v-else>
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </template>
        </svg>
        {{ isPlaying ? '停止' : '播放语音' }}
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.card-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.card-leave-active { transition: all 0.25s ease-in; }
.card-enter-from { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
.card-leave-to { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
</style>
