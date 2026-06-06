import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { db } from '@/db/dexie'
import type {
  BloodSugarType,
  HealthRecord,
  MetricType,
} from '@/types/health'

const metricTypes: MetricType[] = [
  'bloodPressure',
  'bloodSugar',
  'heartRate',
  'weight',
]

export const useHealthStore = defineStore('health', () => {
  const records = ref<HealthRecord[]>([])
  const loading = ref(false)

  const normalizeRecord = (record: HealthRecord): HealthRecord => {
    const base: HealthRecord = {
      id: String(record.id),
      type: record.type,
      value: record.value,
      datetime: Number(record.datetime),
      isAbnormal: Boolean(record.isAbnormal),
      createdAt: Number(record.createdAt),
    }

    if (record.note) {
      base.note = String(record.note)
    }

    if (record.type === 'bloodPressure') {
      const value = record.value as { systolic: number; diastolic: number }
      base.value = {
        systolic: Number(value.systolic),
        diastolic: Number(value.diastolic),
      }
      return base
    }

    if (record.type === 'bloodSugar') {
      const value = record.value as { value: number; subType?: BloodSugarType }
      const subType = (record.subType ?? value.subType) as BloodSugarType
      base.subType = subType
      base.value = {
        value: Number(value.value),
        subType,
      }
      return base
    }

    if (record.type === 'heartRate') {
      const value = record.value as { bpm: number }
      base.value = {
        bpm: Number(value.bpm),
      }
      return base
    }

    const value = record.value as { weight: number }
    base.value = {
      weight: Number(value.weight),
    }
    return base
  }

  const loadRecords = async () => {
    loading.value = true
    records.value = await db.records
      .orderBy('datetime')
      .reverse()
      .toArray()
    loading.value = false
  }

  const addRecord = async (record: HealthRecord) => {
    await db.records.put(normalizeRecord(record))
    await loadRecords()
  }

  const latestByType = computed(() => {
    const map = new Map<MetricType, HealthRecord>()
    for (const type of metricTypes) {
      const found = records.value.find((record) => record.type === type)
      if (found) {
        map.set(type, found)
      }
    }
    return map
  })

  const recentRecords = computed(() => records.value.slice(0, 5))

  const todayRecords = computed(() => {
    const start = dayjs().startOf('day').valueOf()
    return records.value.filter((record) => record.datetime >= start)
  })

  const todayCount = computed(() => todayRecords.value.length)
  const todayAbnormalCount = computed(
    () => todayRecords.value.filter((record) => record.isAbnormal).length
  )

  const lastUpdated = computed(() => records.value[0]?.datetime ?? null)

  return {
    records,
    loading,
    latestByType,
    recentRecords,
    todayCount,
    todayAbnormalCount,
    lastUpdated,
    loadRecords,
    addRecord,
  }
})
