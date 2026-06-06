<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import dayjs from 'dayjs'
import html2canvas from 'html2canvas'
import { showFailToast, showSuccessToast } from 'vant'
import TrendChart from '@/components/charts/TrendChart.vue'
import { useHealthStore } from '@/stores/healthStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { calcStats, getRecordsByType } from '@/services/analytics'
import type { MetricType } from '@/types/health'

const settingsStore = useSettingsStore()
const healthStore = useHealthStore()

const reportRef = ref<HTMLElement | null>(null)
const exporting = ref(false)

const startDate = ref(dayjs().subtract(30, 'day'))
const endDate = ref(dayjs())

const showDatePicker = ref(false)
const pickerMode = ref<'start' | 'end'>('start')
const pickerValue = ref<string[]>([])

const metricList: Array<{ type: MetricType; title: string }> = [
  { type: 'bloodPressure', title: '血压' },
  { type: 'bloodSugar', title: '血糖' },
  { type: 'heartRate', title: '心率' },
  { type: 'weight', title: '体重' },
]

const toDateValue = (value: dayjs.Dayjs) => [
  value.format('YYYY'),
  value.format('MM'),
  value.format('DD'),
]

const parseDateValue = (value: string[]) =>
  dayjs(value.join('-'), 'YYYY-MM-DD')

const startLabel = computed(() => startDate.value.format('YYYY-MM-DD'))
const endLabel = computed(() => endDate.value.format('YYYY-MM-DD'))
const periodLabel = computed(() => `${startLabel.value} ~ ${endLabel.value}`)

const rangeDays = computed(() =>
  endDate.value.startOf('day').diff(startDate.value.startOf('day'), 'day') + 1
)

const recordsInRange = computed(() => {
  const start = startDate.value.startOf('day').valueOf()
  const end = endDate.value.endOf('day').valueOf()
  return healthStore.records.filter(
    (record) => record.datetime >= start && record.datetime <= end
  )
})

const abnormalCount = computed(
  () => recordsInRange.value.filter((record) => record.isAbnormal).length
)

const abnormalSummary = computed(() =>
  metricList
    .map((metric) => {
      const count = recordsInRange.value.filter(
        (record) => record.type === metric.type && record.isAbnormal
      ).length
      return {
        type: metric.type,
        title: metric.title,
        count,
      }
    })
    .filter((item) => item.count > 0)
)

const metricStats = computed(() =>
  metricList.map((metric) => ({
    ...metric,
    stats: calcStats(recordsInRange.value, metric.type),
  }))
)

const chartData = computed(() =>
  metricList.map((metric) => ({
    ...metric,
    records: getRecordsByType(recordsInRange.value, metric.type),
  }))
)

const autoSummary = computed(() => {
  if (recordsInRange.value.length === 0) {
    return '当前时间范围暂无记录。'
  }
  if (abnormalCount.value === 0) {
    return `最近${rangeDays.value}天未发现异常记录，状态稳定。`
  }
  return `最近${rangeDays.value}天共记录${recordsInRange.value.length}次，其中异常${abnormalCount.value}次，请关注波动指标。`
})

const openDatePicker = (mode: 'start' | 'end') => {
  pickerMode.value = mode
  const base = mode === 'start' ? startDate.value : endDate.value
  pickerValue.value = toDateValue(base)
  showDatePicker.value = true
}

const applyDatePicker = () => {
  const next = parseDateValue(pickerValue.value)
  if (!next.isValid()) {
    showFailToast('请选择日期')
    return
  }

  if (pickerMode.value === 'start') {
    startDate.value = next
    if (next.isAfter(endDate.value)) {
      endDate.value = next
    }
  } else {
    endDate.value = next
    if (next.isBefore(startDate.value)) {
      startDate.value = next
    }
  }

  showDatePicker.value = false
}

const exportImage = async () => {
  if (exporting.value || !reportRef.value) {
    return
  }
  exporting.value = true
  try {
    const canvas = await html2canvas(reportRef.value, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    })
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = url
    link.download = `health-report-${dayjs().format('YYYYMMDD-HHmm')}.png`
    link.click()
    showSuccessToast('已导出图片')
  } catch (error) {
    console.error(error)
    showFailToast('导出失败')
  } finally {
    exporting.value = false
  }
}

const printReport = () => {
  window.print()
}

onMounted(async () => {
  await settingsStore.loadSettings()
  await healthStore.loadRecords()
})
</script>

<template>
  <div class="page">
    <div class="section-title no-print">日期范围</div>
    <div class="card p-3 no-print">
      <van-cell-group inset>
        <van-field
          label="开始日期"
          :model-value="startLabel"
          readonly
          is-link
          input-align="right"
          @click="openDatePicker('start')"
        />
        <van-field
          label="结束日期"
          :model-value="endLabel"
          readonly
          is-link
          input-align="right"
          @click="openDatePicker('end')"
        />
      </van-cell-group>
    </div>

    <div class="section-title">报告预览</div>
    <div ref="reportRef" class="card p-4 report-sheet">
      <div class="flex items-center justify-between">
        <div class="text-xl font-semibold">健康报告</div>
        <div class="text-sm text-slate-500">{{ periodLabel }}</div>
      </div>

      <div class="report-section">
        <div class="report-title">用户信息</div>
        <div class="report-info">
          <div>姓名：{{ settingsStore.settings.name || '未填写' }}</div>
          <div>年龄：{{ settingsStore.settings.age ?? '未填写' }}</div>
        </div>
      </div>

      <div class="report-section">
        <div class="report-title">健康摘要</div>
        <div class="report-summary-grid">
          <div class="report-summary-item">
            <div class="text-lg font-semibold">
              {{ recordsInRange.length }}
            </div>
            <div class="text-sm text-slate-500">总记录次数</div>
          </div>
          <div class="report-summary-item">
            <div class="text-lg font-semibold text-red-500">
              {{ abnormalCount }}
            </div>
            <div class="text-sm text-slate-500">异常次数</div>
          </div>
          <div class="report-summary-item">
            <div class="text-lg font-semibold">{{ rangeDays }}</div>
            <div class="text-sm text-slate-500">统计天数</div>
          </div>
        </div>
      </div>

      <div class="report-section">
        <div class="report-title">指标平均值</div>
        <div class="report-summary-grid">
          <div
            v-for="metric in metricStats"
            :key="metric.type"
            class="report-summary-item"
          >
            <div class="text-lg font-semibold">{{ metric.stats.avg }}</div>
            <div class="text-sm text-slate-500">{{ metric.title }}</div>
          </div>
        </div>
      </div>

      <div class="report-section">
        <div class="report-title">异常汇总</div>
        <div v-if="abnormalSummary.length" class="report-list">
          <div v-for="item in abnormalSummary" :key="item.type">
            {{ item.title }}异常：{{ item.count }}次
          </div>
        </div>
        <div v-else class="text-sm text-slate-500">暂无异常记录</div>
      </div>

      <div class="report-section">
        <div class="report-title">趋势图缩略图</div>
        <div class="report-charts">
          <div
            v-for="metric in chartData"
            :key="metric.type"
            class="report-chart"
          >
            <div class="text-sm font-semibold mb-2">{{ metric.title }}</div>
            <TrendChart
              v-if="metric.records.length"
              :records="metric.records"
              :metric-type="metric.type"
              :ranges="settingsStore.settings.ranges"
            />
            <div v-else class="text-sm text-slate-500 text-center py-8">
              暂无数据
            </div>
          </div>
        </div>
      </div>

      <div class="report-section">
        <div class="report-title">自动总结</div>
        <div class="text-sm text-slate-600">{{ autoSummary }}</div>
      </div>
    </div>

    <div class="section-title no-print">导出功能</div>
    <div class="card p-3 no-print">
      <div class="flex flex-col gap-2 sm:flex-row">
        <van-button
          block
          type="primary"
          :loading="exporting"
          @click="exportImage"
        >
          导出图片
        </van-button>
        <van-button block type="default" @click="printReport">
          浏览器打印
        </van-button>
      </div>
    </div>

    <van-popup
      v-model:show="showDatePicker"
      position="bottom"
      round
      :style="{ height: '60vh' }"
    >
      <div class="p-4 h-full flex flex-col">
        <div class="flex items-center justify-between mb-2">
          <van-button size="small" type="default" @click="showDatePicker = false">
            取消
          </van-button>
          <div class="text-sm font-semibold">选择日期</div>
          <van-button size="small" type="primary" @click="applyDatePicker">
            确定
          </van-button>
        </div>
        <div class="flex-1 overflow-y-auto">
          <van-date-picker v-model="pickerValue" :show-toolbar="false" />
        </div>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.report-sheet {
  background: #ffffff;
}

.report-section {
  margin-top: 16px;
}

.report-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
}

.report-info {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--color-subtext);
  font-size: 14px;
}

.report-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.report-summary-item {
  text-align: center;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: rgba(74, 144, 226, 0.05);
}

.report-list {
  display: grid;
  gap: 6px;
  color: var(--color-subtext);
  font-size: 14px;
}

.report-charts {
  display: grid;
  gap: 16px;
}

.report-chart {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: #ffffff;
}

.report-chart :deep(.h-64) {
  height: 180px;
}

@media (max-width: 640px) {
  .report-info {
    flex-direction: column;
  }

  .report-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
