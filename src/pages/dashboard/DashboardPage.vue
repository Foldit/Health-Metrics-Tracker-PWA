<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useHealthStore } from '@/stores/healthStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type { MetricType } from '@/types/health'
import MetricCard from '@/components/health/MetricCard.vue'
import MetricFormPopup from '@/components/health/MetricFormPopup.vue'
import RecentRecords from '@/components/health/RecentRecords.vue'
import { formatDate, formatTime, formatWeekday } from '@/utils/date'

const healthStore = useHealthStore()
const settingsStore = useSettingsStore()

const activeMetric = ref<MetricType>('bloodPressure')
const showPopup = ref(false)

const openPopup = (metric: MetricType) => {
  activeMetric.value = metric
  showPopup.value = true
}

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 11) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const today = computed(() => Date.now())

const metricCards = computed(() => {
  const map = healthStore.latestByType
  const buildCard = (type: MetricType) => {
    const record = map.get(type)
    const status: 'normal' | 'abnormal' | 'empty' = record
      ? record.isAbnormal
        ? 'abnormal'
        : 'normal'
      : 'empty'

    const emptyValue = '--'
    let valueText = emptyValue
    let unit = ''
    let timeText = ''

    if (record) {
      timeText = formatTime(record.datetime)
    }

    if (type === 'bloodPressure') {
      unit = 'mmHg'
      if (record) {
        const value = record.value as { systolic: number; diastolic: number }
        valueText = `${value.systolic}/${value.diastolic}`
      }
    } else if (type === 'bloodSugar') {
      unit = 'mmol/L'
      if (record) {
        const value = record.value as { value: number }
        valueText = `${value.value}`
      }
    } else if (type === 'heartRate') {
      unit = 'BPM'
      if (record) {
        const value = record.value as { bpm: number }
        valueText = `${value.bpm}`
      }
    } else {
      unit = 'kg'
      if (record) {
        const value = record.value as { weight: number }
        valueText = `${value.weight}`
      }
    }

    return {
      type,
      status,
      valueText,
      unit,
      timeText,
    }
  }

  return [
    {
      title: '血压',
      ...buildCard('bloodPressure'),
    },
    {
      title: '血糖',
      ...buildCard('bloodSugar'),
    },
    {
      title: '心率',
      ...buildCard('heartRate'),
    },
    {
      title: '体重',
      ...buildCard('weight'),
    },
  ]
})

const lastUpdated = computed(() => {
  if (!healthStore.lastUpdated) {
    return '暂无'
  }
  return formatTime(healthStore.lastUpdated)
})

onMounted(async () => {
  await settingsStore.loadSettings()
  await healthStore.loadRecords()
})
</script>

<template>
  <div class="page">
    <div class="card p-4">
      <div class="text-sm text-slate-500">
        {{ formatDate(today) }} {{ formatWeekday(today) }}
      </div>
      <div class="text-2xl font-semibold mt-1">{{ greeting }}</div>
      <div v-if="settingsStore.settings.name" class="text-slate-500 mt-1">
        {{ settingsStore.settings.name }}，祝您健康平安
      </div>
    </div>

    <div class="section-title">今日摘要</div>
    <div class="card p-3 summary-grid">
      <div class="summary-item">
        <div class="text-2xl font-semibold">{{ healthStore.todayCount }}</div>
        <div class="text-sm text-slate-500">今日记录</div>
      </div>
      <div class="summary-item">
        <div class="text-2xl font-semibold text-red-500">
          {{ healthStore.todayAbnormalCount }}
        </div>
        <div class="text-sm text-slate-500">异常次数</div>
      </div>
      <div class="summary-item">
        <div class="text-2xl font-semibold">{{ lastUpdated }}</div>
        <div class="text-sm text-slate-500">最近更新</div>
      </div>
    </div>

    <div class="section-title">健康指标</div>
    <div class="metric-grid">
      <MetricCard
        v-for="card in metricCards"
        :key="card.type"
        :title="card.title"
        :value="card.valueText"
        :unit="card.unit"
        :time-text="card.timeText"
        :status="card.status"
        @click="openPopup(card.type)"
      />
    </div>

    <div class="section-title">最近记录</div>
    <RecentRecords :records="healthStore.recentRecords" />

    <MetricFormPopup v-model:show="showPopup" :metric-type="activeMetric" />
  </div>
</template>
