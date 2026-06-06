<script setup lang="ts">
import type { HealthRecord, MetricType } from '@/types/health'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  records: HealthRecord[]
}>()

const metricNames: Record<MetricType, string> = {
  bloodPressure: '血压',
  bloodSugar: '血糖',
  heartRate: '心率',
  weight: '体重',
}

const formatValue = (record: HealthRecord) => {
  if (record.type === 'bloodPressure') {
    const value = record.value as { systolic: number; diastolic: number }
    return `${value.systolic}/${value.diastolic} mmHg`
  }
  if (record.type === 'bloodSugar') {
    const value = record.value as { value: number }
    return `${value.value} mmol/L`
  }
  if (record.type === 'heartRate') {
    const value = record.value as { bpm: number }
    return `${value.bpm} BPM`
  }
  const value = record.value as { weight: number }
  return `${value.weight} kg`
}
</script>

<template>
  <div class="recent-list">
    <div
      v-for="record in props.records"
      :key="record.id"
      class="recent-item"
      :class="{ abnormal: record.isAbnormal }"
    >
      <div>
        <div class="text-sm text-slate-500">
          {{ metricNames[record.type] }} · {{ formatDateTime(record.datetime) }}
        </div>
        <div class="text-base font-semibold">
          {{ formatValue(record) }}
        </div>
      </div>
      <div v-if="record.isAbnormal" class="tag-abnormal">异常</div>
    </div>
    <div v-if="props.records.length === 0" class="text-slate-500">
      暂无记录
    </div>
  </div>
</template>
