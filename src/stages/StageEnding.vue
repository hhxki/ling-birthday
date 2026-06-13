<!-- StageEnding — 谢幕 -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useGameState } from '../composables/useGameState'
import confetti from 'canvas-confetti'
import gsap from 'gsap'

const { reset } = useGameState()

function fireConfetti() {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;'
  document.body.appendChild(canvas)
  const myConfetti = confetti.create(canvas, { resize: true, useWorker: false })

  const colors = ['#ff7b9f', '#ff69b4', '#fbbf24', '#ffd700', '#38bdf8', '#00bfff', '#ff6b6b', '#c084fc', '#ff9a9e', '#fad0c4']

  // 从左侧45°往上轰
  myConfetti({
    particleCount: 80,
    angle: 45,
    spread: 30,
    origin: { x: 0, y: 0.6 },
    colors,
    startVelocity: 80,
    gravity: 1.2,
    scalar: 1.2,
    drift: 0.5,
    flat: false,
    ticks: 300,
  })

  // 从右侧45°往上轰
  myConfetti({
    particleCount: 80,
    angle: 135,
    spread: 30,
    origin: { x: 1, y: 0.6 },
    colors,
    startVelocity: 80,
    gravity: 1.2,
    scalar: 1.2,
    drift: -0.5,
    flat: false,
    ticks: 300,
  })

  // 0.3s 后第二波
  setTimeout(() => {
    myConfetti({
      particleCount: 50,
      angle: 50,
      spread: 35,
      origin: { x: 0.05, y: 0.55 },
      colors,
      startVelocity: 70,
      gravity: 1.0,
      scalar: 1.0,
      drift: 0.3,
      flat: false,
      ticks: 250,
    })
    myConfetti({
      particleCount: 50,
      angle: 130,
      spread: 35,
      origin: { x: 0.95, y: 0.55 },
      colors,
      startVelocity: 70,
      gravity: 1.0,
      scalar: 1.0,
      drift: -0.3,
      flat: false,
      ticks: 250,
    })
  }, 300)

  // 结束后移除 canvas
  setTimeout(() => { canvas.remove() }, 6000)
}

onMounted(() => {
  // 彩带先轰出来
  fireConfetti()

  const tl = gsap.timeline()
  tl.fromTo('.ending-title', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' })
  tl.fromTo('.ending-sub', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.4')
  tl.fromTo('.ending-btn', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' }, '-=0.2')
})

function handleRestart() {
  gsap.to('.ending-content', { opacity: 0, duration: 0.5, onComplete: () => reset() })
}
</script>

<template>
  <div class="fixed inset-0 z-20 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,#111832_0%,#080c18_100%)]">
    <div class="ending-content flex flex-col items-center gap-6 text-center">
      <h1 class="ending-title text-5xl font-bold tracking-[4px] text-[#ff7b9f] m-0" style="text-shadow: 0 0 40px rgba(255,123,159,0.4)">🎂 生日快乐 由川伶</h1>
      <p class="ending-sub text-[15px] tracking-[2px] text-white/50 m-0 max-w-80 leading-relaxed">感谢每一位用心的粉丝，感谢每一段珍贵的回忆</p>

      <div class="mt-4">
        <p class="text-[13px] tracking-[1.5px] text-white/30 my-1">由全体粉丝倾情呈现</p>
        <p class="text-[13px] tracking-[1.5px] text-[#63b3ed] my-1">— 献给最闪耀的你 —</p>
      </div>

      <button
        class="ending-btn mt-6 px-10 py-3.5 rounded-3xl border border-[#ff7b9f]/40 bg-[#ff7b9f]/8 text-[#ff7b9f] text-[15px] tracking-[3px] cursor-pointer transition-all duration-300 hover:bg-[#ff7b9f]/18 hover:border-[#ff7b9f]/70 hover:shadow-[0_0_24px_rgba(255,123,159,0.3),0_0_64px_rgba(255,123,159,0.1)]"
        style="text-shadow: 0 0 12px rgba(255,123,159,0.3)"
        @click="handleRestart"
      >
        再来一次
      </button>
    </div>
  </div>
</template>
