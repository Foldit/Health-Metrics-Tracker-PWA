<script setup lang="ts">
import type { PropType } from 'vue'

defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  unit: {
    type: String,
    required: true,
  },
  timeText: {
    type: String,
    default: '',
  },
  status: {
    type: String as PropType<'normal' | 'abnormal' | 'empty'>,
    required: true,
  },
})

defineEmits(['click'])
</script>

<template>
  <div class="metric-card fade-in" :class="status" @click="$emit('click')">
    <div class="flex items-center justify-between">
      <div class="text-lg font-semibold">{{ title }}</div>
      <span v-if="status === 'abnormal'" class="badge badge-abnormal">
        异常
      </span>
      <span v-else-if="status === 'normal'" class="badge badge-normal">
        正常
      </span>
      <span v-else class="badge">未记录</span>
    </div>
    <div class="mt-3">
      <span class="metric-value">{{ value }}</span>
      <span class="metric-unit">{{ unit }}</span>
    </div>
    <div class="mt-2 text-sm text-slate-500">
      {{ timeText || '暂无记录' }}
    </div>
  </div>
</template>
