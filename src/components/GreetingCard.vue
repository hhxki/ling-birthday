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
    <div class="card-overlay">
      <div class="card-stage">
        <div class="letter-body" :style="{ ...frameStyle, '--lw': '680px' }">
          <div class="letter-content">
            <div class="avatar-row">
              <div class="avatar-circle">
                <div class="avatar-bow">🎀</div>
                <span class="avatar-cat">🐱</span>
              </div>
              <div class="sender-info">
                <span class="sender-label">From</span>
                <span class="sender-name">{{ blessing.from }}</span>
              </div>
            </div>
            <div class="card-divider" />
            <p class="card-text">{{ blessing.text }}</p>
            <button v-if="blessing.audioUrl" class="card-audio-btn" :class="{ playing: isPlaying }" @click="handlePlayVoice">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path v-if="!isPlaying" d="M8 5v14l11-7z" /><template v-else><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></template></svg>
              {{ isPlaying ? '停止' : '播放语音' }}
            </button>
          </div>
          <button class="close-btn" @click="emit('close')" aria-label="关闭">✕</button>
        </div>
        <div class="mascot">
          <img :src="CARD_CONFIG.mascotUrl" alt="mascot" class="mascot-img" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.card-overlay {
  position: fixed; inset: 0; z-index: 100;
  display: flex; align-items: center; justify-content: center;
  background: rgba(8,12,24,0.45); backdrop-filter: blur(4px);
}
.card-stage { position: relative; width: 900px; height: 520px; }
.letter-body {
  position: absolute; left: 60px; top: 30px;
  width: 680px; min-height: 200px; z-index: 10;
  box-sizing: border-box;
}
.letter-content { padding: 16px 190px 16px 28px; }
.avatar-row { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
.avatar-circle {
  width: 56px; height: 56px; border-radius: 50%;
  border: 3px solid #ffccd8; background: #fff0f3;
  display: flex; align-items: center; justify-content: center;
  position: relative; flex-shrink: 0;
  box-shadow: inset 0 2px 4px rgba(255,123,159,0.1);
}
.avatar-bow {
  position: absolute; top: -6px; left: 50%; transform: translateX(-50%);
  background: #ff7b9f; color: #fff; font-size: 9px;
  padding: 1px 6px; border-radius: 999px; white-space: nowrap;
}
.avatar-cat { font-size: 24px; opacity: 0.35; }
.sender-info { display: flex; flex-direction: column; gap: 2px; }
.sender-label { font-size: 10px; letter-spacing: 0.15em; color: #ff7b9f; text-transform: uppercase; }
.sender-name { font-size: 16px; font-weight: 600; color: #334155; }
.card-divider { height: 1px; margin-bottom: 10px; background: linear-gradient(to right, rgba(255,123,159,0.3), transparent 75%); }
.card-text { margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: #475569; white-space: pre-line; }
.card-audio-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 15px; border-radius: 14px;
  border: 1px solid rgba(255,123,159,0.3); background: rgba(255,123,159,0.1);
  color: #ff7b9f; font-size: 13px; cursor: pointer; transition: all 0.2s; width: fit-content;
}
.card-audio-btn:hover { background: rgba(255,123,159,0.2); }
.card-audio-btn.playing { border-color: rgba(99,179,237,0.4); background: rgba(99,179,237,0.15); color: #63b3ed; }
.close-btn {
  position: absolute; top: 14px; right: 18px;
  width: 28px; height: 28px; border-radius: 50%;
  background: #ff7b9f; color: #fff; font-size: 14px; font-weight: bold;
  border: none; cursor: pointer; box-shadow: 0 2px 6px rgba(255,123,159,0.3);
  z-index: 20; transition: background 0.2s;
}
.close-btn:hover { background: #ff5c87; }
.mascot {
  position: absolute; right: 40px; bottom: 10px;
  width: 280px; height: 430px; z-index: 20;
  filter: drop-shadow(0px 8px 16px rgba(0,0,0,0.3));
}
.mascot-img { width: 100%; height: 100%; object-fit: contain; }
.card-enter-active { transition: all 0.45s cubic-bezier(0.34,1.56,0.64,1); }
.card-leave-active { transition: all 0.2s ease-in; }
.card-enter-from { opacity: 0; transform: scale(0.85); }
.card-leave-to { opacity: 0; }
</style>
