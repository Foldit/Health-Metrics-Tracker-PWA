<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Chart from 'chart.js/auto'
import dayjs from 'dayjs'
import type { HealthRecord, MetricType, SettingsRanges } from '@/types/health'

const props = defineProps<{
  records: HealthRecord[]
  metricType: MetricType
  ranges: SettingsRanges
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const chartRef = ref<Chart | null>(null)

const rangePlugin = {
  id: 'rangeBands',
  beforeDatasetsDraw(chart: Chart) {
    const { ctx, chartArea, scales } = chart
    if (!ctx || !chartArea) return
    const y = scales.y

    const drawBand = (min: number, max: number, color: string) => {
      const top = y.getPixelForValue(max)
      const bottom = y.getPixelForValue(min)
      ctx.save()
      ctx.fillStyle = color
      ctx.fillRect(chartArea.left, top, chartArea.right - chartArea.left, bottom - top)
      ctx.restore()
    }

    if (props.metricType === 'bloodPressure') {
      drawBand(
        props.ranges.bloodPressure.systolic.min,
        props.ranges.bloodPressure.systolic.max,
        'rgba(74, 144, 226, 0.12)'
      )
      drawBand(
        props.ranges.bloodPressure.diastolic.min,
        props.ranges.bloodPressure.diastolic.max,
        'rgba(82, 196, 26, 0.12)'
      )
      return
    }

    if (props.metricType === 'bloodSugar') {
      drawBand(
        props.ranges.bloodSugar.fasting.min,
        props.ranges.bloodSugar.postMeal.max,
        'rgba(82, 196, 26, 0.12)'
      )
      return
    }

    if (props.metricType === 'heartRate') {
      drawBand(
        props.ranges.heartRate.min,
        props.ranges.heartRate.max,
        'rgba(82, 196, 26, 0.12)'
      )
      return
    }

    drawBand(
      props.ranges.weight.min,
      props.ranges.weight.max,
      'rgba(82, 196, 26, 0.12)'
    )
  },
}

let buildSeq = 0

const destroyChart = () => {
  if (!chartRef.value) return
  chartRef.value.stop()
  chartRef.value.destroy()
  chartRef.value = null
}

const buildChart = async () => {
  const seq = ++buildSeq
  await nextTick()
  if (seq !== buildSeq) return
  if (!canvasRef.value || !canvasRef.value.isConnected) return
  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return

  const labels = props.records.map((record) =>
    dayjs(record.datetime).format('MM/DD')
  )

  let datasets: Array<{
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    tension: number
    pointBackgroundColor: string[]
    fill: boolean
  }> = []

  if (props.metricType === 'bloodPressure') {
    const systolic = props.records.map(
      (record) => Number((record.value as { systolic: number }).systolic)
    )
    const diastolic = props.records.map(
      (record) => Number((record.value as { diastolic: number }).diastolic)
    )
    const abnormalColors = props.records.map((record) =>
      record.isAbnormal ? '#F5222D' : '#4A90E2'
    )
    const abnormalColors2 = props.records.map((record) =>
      record.isAbnormal ? '#F5222D' : '#52C41A'
    )

    datasets = [
      {
        label: '收缩压',
        data: systolic,
        borderColor: '#4A90E2',
        backgroundColor: 'rgba(74, 144, 226, 0.12)',
        tension: 0.35,
        pointBackgroundColor: abnormalColors,
        fill: false,
      },
      {
        label: '舒张压',
        data: diastolic,
        borderColor: '#52C41A',
        backgroundColor: 'rgba(82, 196, 26, 0.12)',
        tension: 0.35,
        pointBackgroundColor: abnormalColors2,
        fill: false,
      },
    ]
  } else {
    const values = props.records.map((record) => {
      if (props.metricType === 'bloodSugar') {
        return Number((record.value as { value: number }).value)
      }
      if (props.metricType === 'heartRate') {
        return Number((record.value as { bpm: number }).bpm)
      }
      return Number((record.value as { weight: number }).weight)
    })

    const abnormalColors = props.records.map((record) =>
      record.isAbnormal ? '#F5222D' : '#4A90E2'
    )

    datasets = [
      {
        label: '趋势',
        data: values,
        borderColor: '#4A90E2',
        backgroundColor: 'rgba(74, 144, 226, 0.12)',
        tension: 0.35,
        pointBackgroundColor: abnormalColors,
        fill: true,
      },
    ]
  }

  destroyChart()
  chartRef.value = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets,
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: props.metricType === 'bloodPressure',
        },
        tooltip: {
          callbacks: {
            title: (items) => {
              const index = items[0]?.dataIndex ?? 0
              const record = props.records[index]
              if (!record) return ''
              return dayjs(record.datetime).format('MM/DD HH:mm')
            },
            label: (context) => {
              const label = context.dataset.label || '数值'
              return `${label}: ${context.parsed.y}`
            },
            afterBody: (items) => {
              const index = items[0]?.dataIndex ?? 0
              const record = props.records[index]
              if (!record) return ''
              return record.isAbnormal ? '异常' : '正常'
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
        },
        y: {
          ticks: {
            stepSize: props.metricType === 'bloodPressure' ? 10 : undefined,
          },
        },
      },
    },
    plugins: [rangePlugin],
  })
}

watch(
  () => [props.records, props.metricType, props.ranges],
  () => {
    void buildChart()
  },
  { deep: true, flush: 'post' }
)

onMounted(() => {
  void buildChart()
})

onBeforeUnmount(() => {
  destroyChart()
})
</script>

<template>
  <div class="h-64">
    <canvas ref="canvasRef" class="w-full h-full"></canvas>
  </div>
</template>
