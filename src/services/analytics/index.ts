import dayjs from 'dayjs'
import type { HealthRecord, MetricType } from '@/types/health'

export interface MetricStats {
  avg: string
  max: string
  min: string
  abnormalCount: number
}

const roundValue = (value: number, decimals: number) => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

const formatNumber = (type: MetricType, value: number) => {
  const decimals = type === 'bloodSugar' || type === 'weight' ? 1 : 0
  return roundValue(value, decimals).toFixed(decimals)
}

const formatBloodPressure = (systolic: number, diastolic: number) =>
  `${Math.round(systolic)}/${Math.round(diastolic)}`

export const filterByDays = (records: HealthRecord[], days: number) => {
  const since = dayjs().subtract(days - 1, 'day').startOf('day').valueOf()
  return records.filter((record) => record.datetime >= since)
}

export const getRecordsByType = (records: HealthRecord[], type: MetricType) =>
  records
    .filter((record) => record.type === type)
    .sort((a, b) => a.datetime - b.datetime)

export const calcStats = (
  records: HealthRecord[],
  type: MetricType
): MetricStats => {
  const list = getRecordsByType(records, type)
  const abnormalCount = list.filter((record) => record.isAbnormal).length

  if (list.length === 0) {
    return { avg: '--', max: '--', min: '--', abnormalCount }
  }

  if (type === 'bloodPressure') {
    const systolic = list.map((record) =>
      (record.value as { systolic: number }).systolic
    )
    const diastolic = list.map((record) =>
      (record.value as { diastolic: number }).diastolic
    )

    const avgS = systolic.reduce((a, b) => a + b, 0) / systolic.length
    const avgD = diastolic.reduce((a, b) => a + b, 0) / diastolic.length

    return {
      avg: formatBloodPressure(avgS, avgD),
      max: formatBloodPressure(
        Math.max(...systolic),
        Math.max(...diastolic)
      ),
      min: formatBloodPressure(
        Math.min(...systolic),
        Math.min(...diastolic)
      ),
      abnormalCount,
    }
  }

  const values = list.map((record) => {
    if (type === 'bloodSugar') {
      return (record.value as { value: number }).value
    }
    if (type === 'heartRate') {
      return (record.value as { bpm: number }).bpm
    }
    return (record.value as { weight: number }).weight
  })

  const avg = values.reduce((a, b) => a + b, 0) / values.length
  return {
    avg: formatNumber(type, avg),
    max: formatNumber(type, Math.max(...values)),
    min: formatNumber(type, Math.min(...values)),
    abnormalCount,
  }
}
