<!-- GreetingCard — 三宫格贺卡（border-image，单层无拼缝） -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'
import type { Blessing } from '../types'
import { useAudio } from '../composables/useAudio'
import { CARD_CONFIG, AUDIO_CONFIG } from '../data/config'

const props = defineProps<{ blessing: Blessing }>()
const emit = defineEmits<{ close: [] }>()

// ---- 响应式视口 ----
const vpWidth = ref(window.innerWidth)
function onViewportResize() { vpWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onViewportResize))
onBeforeUnmount(() => window.removeEventListener('resize', onViewportResize))

/** 手机端无吉祥物模式（vpWidth ≤ 422px 时 raw scale ≤ 0.5） */
const isMobileLayout = computed(() => (vpWidth.value - 32) / 780 <= 0.5)
/** 卡片缩放 — 手机端无吉祥物时可以更大（分母更小 = 占比更大） */
const cardScale = computed(() => {
  const base = Math.min(1, (vpWidth.value - 32) / 780)
  if (!isMobileLayout.value) return base
  return Math.min(1, (vpWidth.value - 24) / 650)
})
/** 吉祥物缩放 — 基于未放大的原始比例，确保手机端吉祥物仍隐藏 */
const mascotScale = computed(() => {
  const raw = Math.min(1, (vpWidth.value - 32) / 780)
  return Math.max(0.4, raw)
})
/** 卡片主体宽度 */
const cardW = computed(() => Math.round(560 * cardScale.value))
/** 三宫格 --lw */
const lwPx = computed(() => Math.round(680 * cardScale.value))
/** 容器高度 — 桌面 520，移动端按比例 */
const containerH = computed(() => Math.round(520 * cardScale.value))
/** 移动端向上微调：桌面 0，手机端负值把卡片往上推 */
const mobileNudge = computed(() => Math.round(-300 * (1 - cardScale.value)))
/** 卡片左偏移 — 手机端微调右偏，但不超出容器 */
const cardLeft = computed(() => Math.round(40 * cardScale.value))
/** 内容区左侧内边距 — 手机端略加宽，防文字溢出 */
const contentPaddingLeft = computed(() => {
  if (!isMobileLayout.value) return Math.round(44 * mascotScale.value)
  return Math.round(40 * cardScale.value)
})
/** 内容区右侧内边距 — 吉祥物隐藏时缩小，文字更宽 */
const contentPaddingRight = computed(() => {
  if (!isMobileLayout.value) return Math.round(130 * mascotScale.value)
  return Math.round(65 * cardScale.value)
})
/** 关闭按钮尺寸 — 手机端不小于 28px 保证可点 */
const closeBtnSize = computed(() => Math.max(28, Math.round(28 * cardScale.value)))
/** 关闭按钮右偏移 */
const closeBtnRight = computed(() => Math.round(56 * cardScale.value))
/** 关闭按钮上偏移 */
const closeBtnTop = computed(() => Math.round(44 * cardScale.value))
/** 关闭按钮字号 */
const closeBtnFontSize = computed(() => Math.round(14 * cardScale.value))

const { playVoice, duckBGM, restoreBGM } = useAudio()
const isPlaying = ref(false)
const audioAvailable = ref(false)
const audioChecking = ref(true)
const audioRemaining = ref('')
const audioDuration = ref(0)
let currentVoice: ReturnType<typeof playVoice> | null = null
let progressTimer: ReturnType<typeof setInterval> | null = null

// ---- 视频 ----
const videoAvailable = ref(false)
const videoChecking = ref(true)
const videoDuration = ref(0)
const showVideoOverlay = ref(false)
const videoRef = ref<HTMLVideoElement>()
const videoRowRef = ref<HTMLDivElement>()
const videoOverlayRef = ref<HTMLDivElement>()

function fmtTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function startProgress(): void {
  stopProgress()
  if (audioDuration.value > 0) audioRemaining.value = fmtTime(audioDuration.value)
  progressTimer = setInterval(() => {
    const voice = currentVoice
    if (!voice || !isPlaying.value) { stopProgress(); return }
    const p = (voice.seek() as number) || 0
    const d = audioDuration.value || ((voice.duration() as number) || 0)
    audioRemaining.value = fmtTime(Math.max(0, d - p))
  }, 200)
}

function stopProgress(): void {
  if (progressTimer) { clearInterval(progressTimer); progressTimer = null }
}

function checkAudio(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio()
    const timeout = setTimeout(() => resolve(false), 5000)
    audio.onloadedmetadata = () => { clearTimeout(timeout); audioDuration.value = audio.duration || 0; resolve(true) }
    audio.onerror = () => { clearTimeout(timeout); resolve(false) }
    audio.preload = 'metadata'; audio.src = url
  })
}

function checkVideo(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const timeout = setTimeout(() => { resolve(false); cleanup() }, 8000)
    const cleanup = () => {
      video.onloadedmetadata = null; video.onerror = null
      video.src = ''; video.load(); video.remove()
    }
    video.onloadedmetadata = () => { clearTimeout(timeout); videoDuration.value = video.duration || 0; resolve(true); cleanup() }
    video.onerror = () => { clearTimeout(timeout); resolve(false); cleanup() }
    video.preload = 'metadata'; video.crossOrigin = 'anonymous'; video.src = url
  })
}

function handlePlayVideo() {
  showVideoOverlay.value = true; duckBGM()
  nextTick(() => {
    const el = videoOverlayRef.value; const video = videoRef.value
    if (!el || !video || !props.blessing.videoUrl) return
    video.src = props.blessing.videoUrl; video.load()
    gsap.fromTo(el, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' })
    video.play()?.catch(() => {})
  })
}

function handleCloseVideo() {
  if (videoRef.value) { videoRef.value.pause(); videoRef.value.src = '' }
  showVideoOverlay.value = false; restoreBGM(AUDIO_CONFIG.bgmVolume)
}

function handlePlayVoice() {
  if (!props.blessing.audioUrl) return
  if (isPlaying.value) {
    currentVoice?.stop(); stopProgress(); isPlaying.value = false; restoreBGM(AUDIO_CONFIG.bgmVolume); return
  }
  duckBGM()
  currentVoice = playVoice(props.blessing.audioUrl); isPlaying.value = true
  currentVoice.on('end', () => { stopProgress(); isPlaying.value = false; restoreBGM(AUDIO_CONFIG.bgmVolume) })
  currentVoice.on('play', () => startProgress())
  startProgress()
}

// ---- 三宫格 border-image ----
const { cardBgUrl, imageWidth: iw, topSlice: ts, bottomSlice: bs } = CARD_CONFIG
const borderTop = computed(() => `calc(${lwPx.value}px * ${ts / iw})`)
const borderBot = computed(() => `calc(${lwPx.value}px * ${bs / iw})`)
const frameStyle = computed(() => ({
  borderStyle: 'solid', borderColor: 'transparent',
  borderWidth: `${borderTop.value} 0 ${borderBot.value} 0`,
  borderImageSource: `url(${cardBgUrl})`,
  borderImageSlice: `${ts} 0 ${bs} 0 fill`,
  borderImageWidth: `1 0 1 0`,
  borderImageRepeat: 'stretch',
  backgroundClip: 'padding-box',
  width: cardW.value + 'px',
  minHeight: Math.round(390 * mascotScale.value) + 'px',
}))

// ---- entrance / close animation ----
const overlayRef = ref<HTMLDivElement>()
const letterRef = ref<HTMLDivElement>()
const avatarRowRef = ref<HTMLDivElement>()
const dividerRef = ref<HTMLDivElement>()
const textRef = ref<HTMLElement>()
const audioRowRef = ref<HTMLDivElement>()
const closeBtnRef = ref<HTMLButtonElement>()
const mascotRef = ref<HTMLDivElement>()

const isAsciiArt = computed(() => /  /.test(props.blessing.text) && /\\/.test(props.blessing.text))
const isClosing = ref(false)
let enterTl: gsap.core.Timeline | null = null

function showAudioRow(): void {
  nextTick(() => {
    if (audioRowRef.value) {
      gsap.set(audioRowRef.value, { opacity: 0, y: 8 })
      gsap.to(audioRowRef.value, { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' })
    }
  })
}

function showVideoRow(): void {
  nextTick(() => {
    if (videoRowRef.value) {
      gsap.set(videoRowRef.value, { opacity: 0, y: 8 })
      gsap.to(videoRowRef.value, { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' })
    }
  })
}

onMounted(() => {
  enterTl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: () => {
    if (audioAvailable.value) showAudioRow()
    if (videoAvailable.value) showVideoRow()
  }})
  enterTl.to(overlayRef.value!, { opacity: 1, duration: 0.35 })
  const blurState = { val: 0 }
  enterTl.to(blurState, { val: 4, duration: 0.5, ease: 'power3.out', onUpdate: () => {
    if (overlayRef.value) overlayRef.value.style.backdropFilter = `blur(${blurState.val}px)`
  }}, 0)
  enterTl.from(letterRef.value!, { scale: 0.88, opacity: 0, y: 30, duration: 0.7, ease: 'back.out(1.4)' }, '-=0.08')
  if (mascotRef.value) enterTl.from(mascotRef.value, { x: 30, opacity: 0, duration: 0.5, ease: 'power2.out' }, '-=0.45')
  enterTl.from(closeBtnRef.value!, { scale: 0, rotation: -90, duration: 0.45, ease: 'back.out(1.7)' }, '-=0.35')
  enterTl.from(avatarRowRef.value!, { x: -22, opacity: 0, duration: 0.28, ease: 'power2.out' }, '-=0.12')
  enterTl.from(dividerRef.value!, { scaleX: 0, duration: 0.25, ease: 'power2.inOut' }, '-=0.06')
  enterTl.from(textRef.value!, { y: 12, opacity: 0, duration: 0.28 }, '-=0.12')
  if (props.blessing.audioUrl) {
    checkAudio(props.blessing.audioUrl).then((ok) => { audioAvailable.value = ok; audioChecking.value = false; if (ok && enterTl && !enterTl.isActive()) showAudioRow() })
  } else { audioChecking.value = false }
  if (props.blessing.videoUrl) {
    checkVideo(props.blessing.videoUrl).then((ok) => { videoAvailable.value = ok; videoChecking.value = false; if (ok && enterTl && !enterTl.isActive()) showVideoRow() })
  } else { videoChecking.value = false }
})

function handleClose() {
  if (isClosing.value || !enterTl) return
  isClosing.value = true
  if (isPlaying.value) { currentVoice?.stop(); stopProgress(); isPlaying.value = false }
  if (showVideoOverlay.value) { videoRef.value?.pause(); showVideoOverlay.value = false; restoreBGM(AUDIO_CONFIG.bgmVolume) }
  gsap.to(overlayRef.value!, { opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: () => emit('close') })
  const blurOut = { val: 4 }
  gsap.to(blurOut, { val: 0, duration: 0.25, ease: 'power2.in', onUpdate: () => {
    if (overlayRef.value) overlayRef.value.style.backdropFilter = `blur(${blurOut.val}px)`
  }})
}

onBeforeUnmount(() => { stopProgress(); enterTl?.kill(); videoRef.value?.pause() })
</script>

<template>
  <Transition name="card">
    <div ref="overlayRef" class="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(8,12,24,0.45)] opacity-0" style="backdrop-filter: blur(0px)">
      <!-- 外层容器：桌面高度 520，手机端负 margin 上推 -->
      <div class="relative mx-auto" :style="{ width: Math.min(780, vpWidth - 32) + 'px', height: containerH + 'px', marginTop: mobileNudge + 'px' }">
        <!-- 卡片本体 — top 控制垂直位置，越小越靠上 -->
        <div ref="letterRef" class="absolute z-10 will-change-transform" :style="{ left: cardLeft + 'px', top: Math.round(10 * cardScale) + 'px' }">
          <div class="box-border backface-hidden [transform:translateZ(0)]" :style="frameStyle">
            <div :style="{ padding: '1rem', paddingRight: contentPaddingRight + 'px', paddingLeft: contentPaddingLeft + 'px' }">
              <div ref="avatarRowRef" class="flex items-center gap-[14px] mb-2">
                <div class="w-14 h-14 rounded-full border-[3px] border-[#ffccd8] bg-[#fff0f3] flex items-center justify-center relative shrink-0 overflow-hidden shadow-[inset_0_2px_4px_rgba(255,123,159,0.1)]">
                  <img v-if="blessing.avatarUrl" :src="blessing.avatarUrl" alt="" class="w-full h-full object-cover" />
                  <span v-else class="text-2xl opacity-[0.35]">🐱</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="text-[10px] tracking-[0.15em] text-[var(--color-ling-pink)] uppercase">From</span>
                  <span class="text-base font-semibold text-[#334155]">{{ blessing.user }}</span>
                </div>
              </div>
              <div ref="dividerRef" class="h-px mb-2.5 origin-left bg-[linear-gradient(to_right,rgba(255,123,159,0.3),transparent_75%)]" />
              <pre v-if="isAsciiArt" ref="textRef" class="mb-3 text-[13px] leading-[1.8] text-[#475569] whitespace-pre-wrap border-0 bg-transparent p-0 tracking-[-0.02em]" style="font-family: 'Courier New', 'SimSun', monospace">{{ blessing.text }}</pre>
              <p v-else ref="textRef" class="mb-3 text-[15px] leading-[1.7] text-[#475569] whitespace-pre-line">{{ blessing.text }}</p>
              <!-- 音频 -->
              <div v-if="audioAvailable" ref="audioRowRef" class="flex items-center justify-between rounded-xl p-3 border transition-colors duration-300 opacity-0" :class="isPlaying ? 'bg-[rgba(99,179,237,0.06)] border-[rgba(99,179,237,0.2)]' : 'bg-[rgba(255,123,159,0.05)] border-[rgba(255,123,159,0.12)]'">
                <div class="flex items-center gap-3">
                  <button class="w-11 h-11 shrink-0 rounded-full flex items-center justify-center shadow-md transition-transform duration-200 hover:scale-105 cursor-pointer bg-[var(--color-ling-pink)] hover:bg-[#ff5c87]" @click="handlePlayVoice">
                    <svg v-if="!isPlaying" class="h-5 w-5 text-white ml-0.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg>
                    <svg v-else class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><rect x="5" y="4" width="3" height="12" rx="1" /><rect x="12" y="4" width="3" height="12" rx="1" /></svg>
                  </button>
                  <span class="text-xs font-medium text-[#475569]">{{ isPlaying ? '正在播放语音…' : '点击聆听语音祝福' }}</span>
                </div>
                <div class="flex items-center gap-[2px] h-6">
                  <span class="audio-bar w-[3px] rounded-full bg-[var(--color-amber-gold)]" :style="{ animationPlayState: isPlaying ? 'running' : 'paused' }" />
                  <span class="audio-bar w-[3px] rounded-full bg-[var(--color-ling-pink)]" :style="{ animationPlayState: isPlaying ? 'running' : 'paused', animationDelay: '0.10s' }" />
                  <span class="audio-bar w-[3px] rounded-full bg-[var(--color-clear-blue)]" :style="{ animationPlayState: isPlaying ? 'running' : 'paused', animationDelay: '0.20s' }" />
                  <span class="audio-bar w-[3px] rounded-full bg-[var(--color-ling-pink)]" :style="{ animationPlayState: isPlaying ? 'running' : 'paused', animationDelay: '0.30s' }" />
                  <span class="text-xs font-mono text-[var(--color-ling-pink)] ml-2 font-semibold">{{ audioRemaining || (audioDuration > 0 ? fmtTime(audioDuration) : '0:00') }}</span>
                </div>
              </div>
              <!-- 视频 -->
              <div v-if="videoAvailable" ref="videoRowRef" class="flex items-center justify-between rounded-full py-2.5 px-4 border transition-colors duration-300 mt-3 opacity-0 bg-[#fff0f3] border-[#ffccd8]">
                <div class="flex items-center gap-3">
                  <button class="w-11 h-11 shrink-0 rounded-full flex items-center justify-center shadow-md transition-transform duration-200 hover:scale-105 cursor-pointer bg-[var(--color-ling-pink)] hover:bg-[#ff5c87]" @click="handlePlayVideo">
                    <svg class="h-5 w-5 text-white ml-0.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg>
                  </button>
                  <span class="text-xs font-medium text-[#475569]">点击观看视频祝福</span>
                </div>
                <div class="flex items-center gap-2.5 h-6 select-none">
                  <div class="flex items-center gap-[2px] h-3.5"><span class="video-bar w-[3px] rounded-full bg-[var(--color-clear-blue)]" /><span class="video-bar w-[3px] rounded-full bg-[var(--color-ling-pink)]" style="animation-delay: 0.12s" /><span class="video-bar w-[3px] rounded-full bg-[var(--color-amber-gold)]" style="animation-delay: 0.24s" /></div>
                  <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--color-ling-pink)]/10 text-[var(--color-ling-pink)] border border-[var(--color-ling-pink)]/20">720P</span>
                  <span class="text-xs font-mono text-[var(--color-ling-pink)] font-semibold">{{ fmtTime(videoDuration) }}</span>
                </div>
              </div>
            </div>
          </div>
          <!-- 吉祥物 — 锚定卡片右下角，溢出容器可见 -->
          <div v-if="mascotScale > 0.5" ref="mascotRef" class="absolute z-20 drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)] pointer-events-none" :style="{ left: Math.round(420 * mascotScale) + 'px', bottom: Math.round(-100 * mascotScale) + 'px', width: Math.round(280 * mascotScale) + 'px', height: Math.round(430 * mascotScale) + 'px' }">
            <img :src="CARD_CONFIG.mascotUrl" alt="mascot" class="w-full h-full object-contain" />
          </div>
          <!-- 关闭按钮 — 随卡片缩放，手机端保持可点尺寸 -->
          <button ref="closeBtnRef" class="absolute rounded-full bg-[var(--color-ling-pink)] text-white font-bold border-none cursor-pointer shadow-[0_2px_6px_rgba(255,123,159,0.3)] z-30 transition-colors duration-200 hover:bg-[#ff5c87] flex items-center justify-center" :style="{ right: closeBtnRight + 'px', top: closeBtnTop + 'px', width: closeBtnSize + 'px', height: closeBtnSize + 'px', fontSize: closeBtnFontSize + 'px' }" @click="handleClose" aria-label="关闭">✕</button>
        </div>
      </div>
    </div>
  </Transition>
  <!-- 视频播放弹窗 -->
  <Teleport to="body">
    <div v-if="showVideoOverlay" class="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div ref="videoOverlayRef" class="relative pointer-events-auto max-w-[95vw] max-h-[90vh]">
        <video ref="videoRef" controls playsinline preload="auto" class="max-w-full max-h-[85vh]" style="display: block; background: #000;" @ended="handleCloseVideo" />
        <button class="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[var(--color-ling-pink)] text-white text-sm font-bold border-none cursor-pointer shadow-[0_2px_6px_rgba(255,123,159,0.3)] hover:bg-[#ff5c87] transition-colors z-10" @click="handleCloseVideo">✕</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.audio-bar { animation: audioBounce 0.8s infinite ease-in-out; height: 5px; }
@keyframes audioBounce { 0%, 100% { height: 5px; } 50% { height: 18px; } }
.video-bar { animation: videoBounce 0.8s ease-in-out infinite alternate; height: 4px; }
@keyframes videoBounce { 0% { height: 4px; } 100% { height: 14px; } }
</style>
