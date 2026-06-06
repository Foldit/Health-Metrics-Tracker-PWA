import { defineStore } from 'pinia'
import { ref, toRaw } from 'vue'
import { db } from '@/db/dexie'
import type { UserSettings } from '@/types/health'

export const createDefaultSettings = (): UserSettings => ({
  id: 'main',
  name: '',
  age: undefined,
  ranges: {
    bloodPressure: {
      systolic: { min: 90, max: 140 },
      diastolic: { min: 60, max: 90 },
    },
    bloodSugar: {
      fasting: { min: 3.9, max: 6.1 },
      postMeal: { min: 0, max: 7.8 },
    },
    heartRate: { min: 60, max: 100 },
    weight: { min: 45, max: 90 },
  },
})

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>(createDefaultSettings())
  const ready = ref(false)

  const normalizeSettings = (value: UserSettings): UserSettings => {
    const raw = toRaw(value) as UserSettings
    const normalized: UserSettings = {
      id: 'main',
      name: String(raw.name ?? ''),
      ranges: {
        bloodPressure: {
          systolic: {
            min: Number(raw.ranges.bloodPressure.systolic.min),
            max: Number(raw.ranges.bloodPressure.systolic.max),
          },
          diastolic: {
            min: Number(raw.ranges.bloodPressure.diastolic.min),
            max: Number(raw.ranges.bloodPressure.diastolic.max),
          },
        },
        bloodSugar: {
          fasting: {
            min: Number(raw.ranges.bloodSugar.fasting.min),
            max: Number(raw.ranges.bloodSugar.fasting.max),
          },
          postMeal: {
            min: Number(raw.ranges.bloodSugar.postMeal.min),
            max: Number(raw.ranges.bloodSugar.postMeal.max),
          },
        },
        heartRate: {
          min: Number(raw.ranges.heartRate.min),
          max: Number(raw.ranges.heartRate.max),
        },
        weight: {
          min: Number(raw.ranges.weight.min),
          max: Number(raw.ranges.weight.max),
        },
      },
    }

    if (typeof raw.age === 'number' && !Number.isNaN(raw.age)) {
      normalized.age = raw.age
    }

    return normalized
  }

  const loadSettings = async () => {
    if (ready.value) {
      return
    }
    const existing = await db.settings.get('main')
    if (existing) {
      settings.value = existing
    } else {
      settings.value = createDefaultSettings()
      await db.settings.put(normalizeSettings(settings.value))
    }
    ready.value = true
  }

  const saveSettings = async () => {
    await db.settings.put(normalizeSettings(settings.value))
  }

  const reloadSettings = async () => {
    ready.value = false
    await loadSettings()
  }

  return {
    settings,
    ready,
    loadSettings,
    reloadSettings,
    saveSettings,
  }
})
