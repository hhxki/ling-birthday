<!-- GreetingCard — 三宫格贺卡（border-image，单层无拼缝） -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Blessing } from '../types'
import { useAudio } from '../composables/useAudio'
import { CARD_CONFIG } from '../data/config'

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

const { cardBgUrl, imageWidth: iw, imageHeight: ih, topSlice: ts, bottomSlice: bs } = CARD_CONFIG

const borderTop = computed(() => `calc(var(--lw) * ${ts / iw})`)
const borderBot = computed(() => `calc(var(--lw) * ${bs / iw})`)

const frameStyle = computed(() => ({
  borderStyle: 'solid',
  borderColor: 'transparent',
  borderWidth: `${borderTop.value} 0 ${borderBot.value} 0`,
  borderImageSource: `url(${cardBgUrl})`,
  borderImageSlice: `${ts} 0 ${bs} 0 fill`,
  borderImageWidth: `1 0 1 0`,
  borderImageRepeat: 'stretch',
  backgroundClip: 'padding-box',
}))
</script>

<template>
  <Transition name="card">
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(8,12,24,0.45)] backdrop-blur-sm">
      <div class="relative w-[780px] h-[520px]">
        <div
          class="absolute left-[60px] top-[30px] w-[560px] min-h-[200px] z-10 box-border"
          :style="{ ...frameStyle, '--lw': '680px' }"
        >
          <div class="py-4 pr-[130px] pl-11">
            <div class="flex items-center gap-[14px] mb-2">
              <div class="w-14 h-14 rounded-full border-[3px] border-[#ffccd8] bg-[#fff0f3] flex items-center justify-center relative shrink-0 shadow-[inset_0_2px_4px_rgba(255,123,159,0.1)]">
                <div class="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-[var(--color-ling-pink)] text-white text-[9px] py-px px-1.5 rounded-full whitespace-nowrap">🎀</div>
                <span class="text-2xl opacity-[0.35]">🐱</span>
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="text-[10px] tracking-[0.15em] text-[var(--color-ling-pink)] uppercase">From</span>
                <span class="text-base font-semibold text-[#334155]">{{ blessing.from }}</span>
              </div>
            </div>
            <div class="h-px mb-2.5 bg-[linear-gradient(to_right,rgba(255,123,159,0.3),transparent_75%)]" />
            <p class="mb-3 text-[15px] leading-[1.7] text-[#475569] whitespace-pre-line">{{ blessing.text }}</p>
            <button
              v-if="blessing.audioUrl"
              class="inline-flex items-center gap-1.5 py-[7px] px-[15px] rounded-[14px] border text-[13px] cursor-pointer transition-all duration-200 w-fit"
              :class="isPlaying
                ? 'border-[rgba(99,179,237,0.4)] bg-[rgba(99,179,237,0.15)] text-[var(--color-clear-blue)]'
                : 'border-[rgba(255,123,159,0.3)] bg-[rgba(255,123,159,0.1)] text-[var(--color-ling-pink)] hover:bg-[rgba(255,123,159,0.2)]'"
              @click="handlePlayVoice"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path v-if="!isPlaying" d="M8 5v14l11-7z" /><template v-else><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></template></svg>
              {{ isPlaying ? '停止' : '播放语音' }}
            </button>
          </div>
        </div>
        <button
          class="absolute right-[215px] top-[70px] w-7 h-7 rounded-full bg-[var(--color-ling-pink)] text-white text-sm font-bold border-none cursor-pointer shadow-[0_2px_6px_rgba(255,123,159,0.3)] z-30 transition-colors duration-200 hover:bg-[#ff5c87]"
          @click="emit('close')"
          aria-label="关闭"
        >✕</button>
        <div class="absolute right-5 bottom-2.5 w-[280px] h-[430px] z-20 drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)]">
          <img :src="CARD_CONFIG.mascotUrl" alt="mascot" class="w-full h-full object-contain" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.card-enter-active { transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1); }
.card-leave-active { transition: all 0.2s ease-in; }
.card-enter-from { opacity: 0; transform: scale(0.85); }
.card-leave-to { opacity: 0; }
</style>
