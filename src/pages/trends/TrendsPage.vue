<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import TrendChart from '@/components/charts/TrendChart.vue'
import { useHealthStore } from '@/stores/healthStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { calcStats, filterByDays, getRecordsByType } from '@/services/analytics'
import type { MetricType } from '@/types/health'

const healthStore = useHealthStore()
const settingsStore = useSettingsStore()

const activeMetric = ref<MetricType>('bloodPressure')
const activeRange = ref(30)

const rangeOptions = [7, 30, 90]

const filteredRecords = computed(() => {
  const byRange = filterByDays(healthStore.records, activeRange.value)
  return getRecordsByType(byRange, activeMetric.value)
})

const stats = computed(() =>
  calcStats(filterByDays(healthStore.records, activeRange.value), activeMetric.value)
)

const metricTabs = [
  { name: 'bloodPressure', title: '血压' },
  { name: 'bloodSugar', title: '血糖' },
  { name: 'heartRate', title: '心率' },
  { name: 'weight', title: '体重' },
]

onMounted(async () => {
  await settingsStore.loadSettings()
  await healthStore.loadRecords()
})
</script>

<template>
  <div class="page">
    <div class="card p-3">
      <van-tabs v-model:active="activeMetric" swipeable>
        <van-tab
          v-for="tab in metricTabs"
          :key="tab.name"
          :name="tab.name"
          :title="tab.title"
        />
      </van-tabs>
    </div>

    <div class="section-title">时间范围</div>
    <div class="range-button-group">
      <button
        v-for="range in rangeOptions"
        :key="range"
        class="range-button"
        :class="{ active: activeRange === range }"
        type="button"
        @click="activeRange = range"
      >
        {{ range }}天
      </button>
    </div>

    <div class="section-title">趋势图</div>
    <div class="card p-3">
      <TrendChart
        v-if="filteredRecords.length"
        :records="filteredRecords"
        :metric-type="activeMetric"
        :ranges="settingsStore.settings.ranges"
      />
      <div v-else class="text-slate-500 text-center py-10">暂无数据</div>
    </div>

    <div class="section-title">统计信息</div>
    <div class="card p-3 summary-grid">
      <div class="summary-item">
        <div class="text-lg font-semibold">{{ stats.avg }}</div>
        <div class="text-sm text-slate-500">平均值</div>
      </div>
      <div class="summary-item">
        <div class="text-lg font-semibold">{{ stats.max }}</div>
        <div class="text-sm text-slate-500">最高值</div>
      </div>
      <div class="summary-item">
        <div class="text-lg font-semibold">{{ stats.min }}</div>
        <div class="text-sm text-slate-500">最低值</div>
      </div>
      <div class="summary-item">
        <div class="text-lg font-semibold text-red-500">
          {{ stats.abnormalCount }}
        </div>
        <div class="text-sm text-slate-500">异常次数</div>
      </div>
    </div>
  </div>
</template>
