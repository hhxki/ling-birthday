<!-- StageTimeline — 时光长廊 -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useGameState } from '../composables/useGameState'
import { timelineData } from '../data/timeline'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const { nextStage } = useGameState()
const containerRef = ref<HTMLDivElement>()
const reachedEnd = ref(false)
const currentIndex = ref(0)
const totalCards = timelineData.length
const isLastCard = computed(() => currentIndex.value >= totalCards - 1)

function scrollToCard(index: number) {
  if (!containerRef.value) return
  const cards = containerRef.value.querySelectorAll('.tl-card')
  if (index < 0 || index >= cards.length) return
  cards[index].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  currentIndex.value = index
}

function goNext() {
  if (isLastCard.value) {
    reachedEnd.value = true
    setTimeout(() => nextStage(), 800)
  } else {
    scrollToCard(currentIndex.value + 1)
  }
}

function goPrev() {
  if (currentIndex.value > 0) scrollToCard(currentIndex.value - 1)
}

onMounted(() => {
  if (!containerRef.value) return
  const cards = containerRef.value.querySelectorAll('.tl-card')

  cards.forEach((card, i) => {
    gsap.fromTo(card, { y: 60, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.6, delay: i * 0.15, ease: 'power2.out',
      scrollTrigger: { trigger: card, start: 'left 85%' },
    })
  })

  const el = containerRef.value
  const checkEnd = () => {
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 60
    if (atEnd && !reachedEnd.value) reachedEnd.value = true
    const cardWidth = (cards[0] as HTMLElement)?.clientWidth || 360
    const gap = 8 * (window.innerWidth / 100)
    currentIndex.value = Math.round(el.scrollLeft / (cardWidth + gap))
  }
  el.addEventListener('scroll', checkEnd, { passive: true })
})

onUnmounted(() => {
  ScrollTrigger.getAll().forEach((st) => st.kill())
})
</script>

<template>
  <div
    ref="containerRef"
    class="fixed inset-0 z-10 overflow-x-auto overflow-y-hidden scrollbar-none bg-[#0b0f19]"
    style="scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch;"
  >
    <div class="flex h-full items-center px-[10vw] gap-[8vw]">
      <article
        v-for="item in timelineData"
        :key="item.id"
        class="tl-card flex-shrink-0 flex flex-col items-center gap-7 w-[min(360px,70vw)]"
        style="scroll-snap-align: center;"
      >
        <!-- 胶片框 -->
        <div class="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-[#1a1f2e] shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
          <div class="absolute inset-x-0 top-0 h-3 z-2" style="background: repeating-linear-gradient(to right, transparent 0, transparent 12px, rgba(0,0,0,0.5) 12px, rgba(0,0,0,0.5) 18px, transparent 18px, transparent 30px)" />
          <div class="absolute inset-x-[8px] inset-y-[12px] overflow-hidden rounded-sm">
            <img :src="item.imageUrl" :alt="item.title" class="w-full h-full object-cover transition-all duration-400" style="filter: sepia(0.15) brightness(0.9)" loading="lazy" />
          </div>
          <div class="absolute inset-x-0 bottom-0 h-3" style="background: repeating-linear-gradient(to right, transparent 0, transparent 12px, rgba(0,0,0,0.5) 12px, rgba(0,0,0,0.5) 18px, transparent 18px, transparent 30px)" />
        </div>

        <!-- 文字 -->
        <div class="text-center max-w-80">
          <time class="text-[11px] tracking-[3px] text-[#63b3ed] uppercase">{{ item.date }}</time>
          <h3 class="text-lg font-semibold text-white my-2 tracking-wider">{{ item.title }}</h3>
          <p class="text-[13px] leading-relaxed text-white/55 m-0">{{ item.description }}</p>
        </div>
      </article>
    </div>

    <!-- 导航按钮 -->
    <div class="fixed right-6 bottom-9 z-20 flex items-center gap-3.5">
      <button
        class="w-11 h-11 rounded-full flex items-center justify-center bg-[#131a26]/70 backdrop-blur-xl border border-[#ff7b9f]/25 text-white/70 cursor-pointer transition-all duration-250 flex-shrink-0 hover:bg-[#ff7b9f]/15 hover:border-[#ff7b9f]/50 hover:text-[#ff7b9f]"
        :class="{ 'opacity-25 cursor-default': currentIndex <= 0 }"
        :disabled="currentIndex <= 0"
        @click="goPrev"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 6L9 12L15 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>

      <span class="text-xs tracking-[2px] text-white/40 min-w-[40px] text-center">{{ currentIndex + 1 }} / {{ totalCards }}</span>

      <button
        class="w-11 h-11 rounded-full flex items-center justify-center bg-[#131a26]/70 backdrop-blur-xl border border-[#ff7b9f]/25 text-white/70 cursor-pointer transition-all duration-250 flex-shrink-0 hover:bg-[#ff7b9f]/15 hover:border-[#ff7b9f]/50 hover:text-[#ff7b9f]"
        @click="goNext"
      >
        <svg v-if="!isLastCard" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
        <span v-else class="text-xs tracking-[2px] whitespace-nowrap text-[#ffb03a]">谢幕 →</span>
      </button>
    </div>
  </div>
</template>
