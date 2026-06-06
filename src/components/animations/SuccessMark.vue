<script setup lang="ts">
import { ref, watch } from 'vue'
import { animate } from 'animejs'

const props = defineProps<{ show: boolean }>()
const markRef = ref<HTMLDivElement | null>(null)

watch(
  () => props.show,
  (value) => {
    if (!value || !markRef.value) {
      return
    }
    animate(markRef.value, {
      scale: [0.6, 1],
      opacity: [0, 1],
      easing: 'easeOutElastic(1, .6)',
      duration: 650,
    })
  }
)
</script>

<template>
  <div v-if="show" class="success-overlay">
    <div ref="markRef" class="success-mark">✓</div>
    <div class="success-text">已保存</div>
  </div>
</template>

<style scoped>
.success-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 18px;
}

.success-mark {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(82, 196, 26, 0.14);
  color: #52c41a;
  font-size: 36px;
  font-weight: 700;
}

.success-text {
  font-size: 16px;
  color: #1f2937;
}
</style>
