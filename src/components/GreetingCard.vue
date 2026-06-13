<!-- GreetingCard — 三宫格贺卡（border-image，单层无拼缝） -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
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

const { cardBgUrl, imageWidth: iw, topSlice: ts, bottomSlice: bs } = CARD_CONFIG

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

// ---- entrance / close animation ----
const overlayRef = ref<HTMLDivElement>()
const letterRef = ref<HTMLDivElement>()
const avatarRowRef = ref<HTMLDivElement>()
const dividerRef = ref<HTMLDivElement>()
const textRef = ref<HTMLParagraphElement>()
const audioRowRef = ref<HTMLDivElement>()
const closeBtnRef = ref<HTMLButtonElement>()
const mascotRef = ref<HTMLDivElement>()

const isClosing = ref(false)
let enterTl: gsap.core.Timeline | null = null

onMounted(() => {
  enterTl = gsap.timeline({ defaults: { ease: 'power3.out' } })

  // 1. backdrop
  enterTl.from(overlayRef.value!, { opacity: 0, duration: 0.35 })

  // 2. letter body — scale up with bounce
  enterTl.from(letterRef.value!, {
    scale: 0.88, opacity: 0, y: 30,
    duration: 0.7, ease: 'back.out(1.4)',
  }, '-=0.08')

  // 3. mascot — slide in from right (in wrapper coords)
  enterTl.from(mascotRef.value!, {
    x: 30, opacity: 0,
    duration: 0.5, ease: 'power2.out',
  }, '-=0.45')

  // 4. close button — spin + pop
  enterTl.from(closeBtnRef.value!, {
    scale: 0, rotation: -90,
    duration: 0.45, ease: 'back.out(1.7)',
  }, '-=0.35')

  // 5. avatar row — slide in from left
  enterTl.from(avatarRowRef.value!, {
    x: -22, opacity: 0,
    duration: 0.4, ease: 'power2.out',
  }, '-=0.15')

  // 6. divider — stretch from left
  enterTl.from(dividerRef.value!, {
    scaleX: 0,
    duration: 0.35, ease: 'power2.inOut',
  }, '-=0.08')

  // 7. text — fade up
  enterTl.from(textRef.value!, {
    y: 12, opacity: 0,
    duration: 0.4,
  }, '-=0.08')

  // 8. audio row (conditional)
  if (audioRowRef.value) {
    enterTl.from(audioRowRef.value, {
      y: 8, opacity: 0,
      duration: 0.3,
    }, '-=0.05')
  }
})

function handleClose() {
  if (isClosing.value || !enterTl) return
  isClosing.value = true
  gsap.to(overlayRef.value!, { opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: () => emit('close') })
}

onBeforeUnmount(() => {
  enterTl?.kill()
})
</script>

<template>
  <Transition name="card">
    <div ref="overlayRef" class="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(8,12,24,0.45)] backdrop-blur-sm">
      <div class="relative w-[780px] h-[520px]">
        <!-- wrapper 负责定位 + GSAP 缩放，border-image 在内层以 1:1 渲染避免切图接缝闪烁 -->
        <div ref="letterRef" class="absolute left-[60px] top-[30px] z-10 will-change-transform">
          <div
            class="w-[560px] min-h-[200px] box-border backface-hidden [transform:translateZ(0)]"
            :style="{ ...frameStyle, '--lw': '680px' }"
          >
            <div class="py-4 pr-[130px] pl-11">
            <div ref="avatarRowRef" class="flex items-center gap-[14px] mb-2">
              <div class="w-14 h-14 rounded-full border-[3px] border-[#ffccd8] bg-[#fff0f3] flex items-center justify-center relative shrink-0 shadow-[inset_0_2px_4px_rgba(255,123,159,0.1)]">
                <div class="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-[var(--color-ling-pink)] text-white text-[9px] py-px px-1.5 rounded-full whitespace-nowrap">🎀</div>
                <span class="text-2xl opacity-[0.35]">🐱</span>
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="text-[10px] tracking-[0.15em] text-[var(--color-ling-pink)] uppercase">From</span>
                <span class="text-base font-semibold text-[#334155]">{{ blessing.from }}</span>
              </div>
            </div>
            <div ref="dividerRef" class="h-px mb-2.5 origin-left bg-[linear-gradient(to_right,rgba(255,123,159,0.3),transparent_75%)]" />
            <p ref="textRef" class="mb-3 text-[15px] leading-[1.7] text-[#475569] whitespace-pre-line">{{ blessing.text }}</p>
            <div
              v-if="blessing.audioUrl"
              ref="audioRowRef"
              class="flex items-center justify-between rounded-xl p-3 border transition-colors duration-300"
              :class="isPlaying
                ? 'bg-[rgba(99,179,237,0.06)] border-[rgba(99,179,237,0.2)]'
                : 'bg-[rgba(255,123,159,0.05)] border-[rgba(255,123,159,0.12)]'"
            >
              <!-- left: circular play button + label -->
              <div class="flex items-center gap-3">
                <button
                  class="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform duration-200 hover:scale-105 cursor-pointer bg-gradient-to-r from-[var(--color-ling-pink)] to-[var(--color-amber-gold)]"
                  @click="handlePlayVoice"
                >
                  <svg v-if="!isPlaying" class="h-5 w-5 text-white ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                  </svg>
                  <svg v-else class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <rect x="5" y="4" width="3" height="12" rx="1" />
                    <rect x="12" y="4" width="3" height="12" rx="1" />
                  </svg>
                </button>
                <span class="text-xs font-medium text-[#475569]">{{ isPlaying ? '正在播放语音…' : '点击聆听语音祝福' }}</span>
              </div>

              <!-- right: bouncing bars + time -->
              <div class="flex items-center gap-[2px] h-6">
                <span class="audio-bar w-[3px] rounded-full bg-[var(--color-amber-gold)]" />
                <span class="audio-bar w-[3px] rounded-full bg-[var(--color-ling-pink)]" style="animation-delay: 0.10s" />
                <span class="audio-bar w-[3px] rounded-full bg-[var(--color-clear-blue)]" style="animation-delay: 0.20s" />
                <span class="audio-bar w-[3px] rounded-full bg-[var(--color-ling-pink)]" style="animation-delay: 0.30s" />
                <span class="text-xs font-mono text-[var(--color-ling-pink)] ml-2 font-semibold">0:12</span>
              </div>
            </div>
          </div>
          <!-- mascot 锚定贺卡右下角，高度变化时自动跟随 -->
          <div ref="mascotRef" class="absolute left-[420px] bottom-[-163px] w-[280px] h-[430px] z-20 drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)] pointer-events-none">
            <img :src="CARD_CONFIG.mascotUrl" alt="mascot" class="w-full h-full object-contain" />
          </div>
        </div>
        </div>
        <button
          ref="closeBtnRef"
          class="absolute right-[215px] top-[70px] w-7 h-7 rounded-full bg-[var(--color-ling-pink)] text-white text-sm font-bold border-none cursor-pointer shadow-[0_2px_6px_rgba(255,123,159,0.3)] z-30 transition-colors duration-200 hover:bg-[#ff5c87]"
          @click="handleClose"
          aria-label="关闭"
        >✕</button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* ---- audio bars ---- */
.audio-bar {
  animation: audioBounce 0.8s infinite ease-in-out;
  height: 5px;
}
@keyframes audioBounce {
  0%, 100% { height: 5px; }
  50% { height: 18px; }
}
</style>
