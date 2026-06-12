<!-- LoadingScreen — 加载画面 -->
<script setup lang="ts">
defineProps<{ progress: number; error?: boolean }>()
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0f19]">
    <div class="flex flex-col items-center gap-6">
      <!-- 火柴图标 -->
      <div class="transition-transform duration-600" :class="{ 'animate-[breathe_1.8s_ease-in-out_infinite]': progress >= 100 }">
        <svg width="48" height="120" viewBox="0 0 48 120" fill="none">
          <rect x="20" y="30" width="6" height="75" rx="3" fill="#8B7355" />
          <ellipse cx="23" cy="28" rx="10" ry="14" fill="#C41E3A" />
          <ellipse cx="21" cy="24" rx="5" ry="7" fill="#FF6B6B" opacity="0.6" />
        </svg>
      </div>

      <!-- 提示 -->
      <p v-if="error" class="text-sm tracking-widest text-[#ffb03a] m-0">部分资源加载失败，点击继续</p>
      <p v-else-if="progress < 100" class="text-sm tracking-widest text-white/45 m-0">擦亮火柴，唤醒长夜</p>
      <p v-else class="text-sm tracking-widest text-[#ff7b9f] m-0">划动火柴，开始旅程</p>
    </div>
  </div>
</template>

<style scoped>
@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}
</style>
