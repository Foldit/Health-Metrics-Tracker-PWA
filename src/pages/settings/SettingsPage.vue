<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  showConfirmDialog,
  showFailToast,
  showSuccessToast,
} from 'vant'
import dayjs from 'dayjs'
import { db } from '@/db/dexie'
import { useHealthStore } from '@/stores/healthStore'
import {
  createDefaultSettings,
  useSettingsStore,
} from '@/stores/settingsStore'
import type {
  BloodSugarType,
  HealthRecord,
  MetricType,
  UserSettings,
} from '@/types/health'

const settingsStore = useSettingsStore()
const healthStore = useHealthStore()
const fileInputRef = ref<HTMLInputElement | null>(null)
const exporting = ref(false)
const importing = ref(false)
const clearing = ref(false)

const metricTypes: MetricType[] = [
  'bloodPressure',
  'bloodSugar',
  'heartRate',
  'weight',
]
const bloodSugarTypes: BloodSugarType[] = ['fasting', 'postMeal']

const toNumber = (value: unknown, fallback: number) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

const buildId = (value: unknown) => {
  const base = String(value ?? '')
  if (base) {
    return base
  }
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const normalizeImportedSettings = (value?: UserSettings | null): UserSettings => {
  const base = createDefaultSettings()
  if (!value || typeof value !== 'object') {
    return base
  }
  const raw = value as UserSettings
  base.name = String(raw.name ?? '')
  if (typeof raw.age === 'number' && Number.isFinite(raw.age)) {
    base.age = raw.age
  }

  base.ranges.bloodPressure.systolic.min = toNumber(
    raw.ranges?.bloodPressure?.systolic?.min,
    base.ranges.bloodPressure.systolic.min
  )
  base.ranges.bloodPressure.systolic.max = toNumber(
    raw.ranges?.bloodPressure?.systolic?.max,
    base.ranges.bloodPressure.systolic.max
  )
  base.ranges.bloodPressure.diastolic.min = toNumber(
    raw.ranges?.bloodPressure?.diastolic?.min,
    base.ranges.bloodPressure.diastolic.min
  )
  base.ranges.bloodPressure.diastolic.max = toNumber(
    raw.ranges?.bloodPressure?.diastolic?.max,
    base.ranges.bloodPressure.diastolic.max
  )

  base.ranges.bloodSugar.fasting.min = toNumber(
    raw.ranges?.bloodSugar?.fasting?.min,
    base.ranges.bloodSugar.fasting.min
  )
  base.ranges.bloodSugar.fasting.max = toNumber(
    raw.ranges?.bloodSugar?.fasting?.max,
    base.ranges.bloodSugar.fasting.max
  )
  base.ranges.bloodSugar.postMeal.min = toNumber(
    raw.ranges?.bloodSugar?.postMeal?.min,
    base.ranges.bloodSugar.postMeal.min
  )
  base.ranges.bloodSugar.postMeal.max = toNumber(
    raw.ranges?.bloodSugar?.postMeal?.max,
    base.ranges.bloodSugar.postMeal.max
  )

  base.ranges.heartRate.min = toNumber(
    raw.ranges?.heartRate?.min,
    base.ranges.heartRate.min
  )
  base.ranges.heartRate.max = toNumber(
    raw.ranges?.heartRate?.max,
    base.ranges.heartRate.max
  )

  base.ranges.weight.min = toNumber(
    raw.ranges?.weight?.min,
    base.ranges.weight.min
  )
  base.ranges.weight.max = toNumber(
    raw.ranges?.weight?.max,
    base.ranges.weight.max
  )

  return base
}

const normalizeImportedRecord = (record: HealthRecord): HealthRecord | null => {
  if (!record || !metricTypes.includes(record.type)) {
    return null
  }

  const base: HealthRecord = {
    id: buildId(record.id),
    type: record.type,
    value: record.value,
    datetime: toNumber(record.datetime, Date.now()),
    isAbnormal: Boolean(record.isAbnormal),
    createdAt: toNumber(record.createdAt, Date.now()),
  }

  if (record.note) {
    base.note = String(record.note)
  }

  if (record.type === 'bloodPressure') {
    const value = record.value as { systolic?: unknown; diastolic?: unknown }
    const systolic = toNumber(value?.systolic, NaN)
    const diastolic = toNumber(value?.diastolic, NaN)
    if (!Number.isFinite(systolic) || !Number.isFinite(diastolic)) {
      return null
    }
    base.value = { systolic, diastolic }
    return base
  }

  if (record.type === 'bloodSugar') {
    const value = record.value as { value?: unknown; subType?: unknown }
    const amount = toNumber(value?.value, NaN)
    if (!Number.isFinite(amount)) {
      return null
    }
    const rawSubType = (record.subType ?? value?.subType) as BloodSugarType
    const subType = bloodSugarTypes.includes(rawSubType)
      ? rawSubType
      : 'fasting'
    base.subType = subType
    base.value = { value: amount, subType }
    return base
  }

  if (record.type === 'heartRate') {
    const value = record.value as { bpm?: unknown }
    const bpm = toNumber(value?.bpm, NaN)
    if (!Number.isFinite(bpm)) {
      return null
    }
    base.value = { bpm }
    return base
  }

  const value = record.value as { weight?: unknown }
  const weight = toNumber(value?.weight, NaN)
  if (!Number.isFinite(weight)) {
    return null
  }
  base.value = { weight }
  return base
}

const save = async () => {
  await settingsStore.saveSettings()
  showSuccessToast('已保存设置')
}

const exportData = async () => {
  if (exporting.value) {
    return
  }
  exporting.value = true
  try {
    const [records, storedSettings] = await Promise.all([
      db.records.toArray(),
      db.settings.get('main'),
    ])
    const payload = {
      version: 1,
      exportedAt: Date.now(),
      records,
      settings: storedSettings ?? createDefaultSettings(),
    }
    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `health-data-${dayjs().format('YYYYMMDD-HHmm')}.json`
    link.click()
    URL.revokeObjectURL(url)
    showSuccessToast('已导出数据')
  } catch (error) {
    console.error(error)
    showFailToast('导出失败')
  } finally {
    exporting.value = false
  }
}

const triggerImport = () => {
  fileInputRef.value?.click()
}

const parseImportPayload = (payload: unknown) => {
  if (Array.isArray(payload)) {
    return { records: payload as HealthRecord[], settings: undefined }
  }
  if (!payload || typeof payload !== 'object') {
    return null
  }
  const data = payload as {
    records?: unknown
    settings?: unknown
  }
  if (!Array.isArray(data.records)) {
    return null
  }
  return {
    records: data.records as HealthRecord[],
    settings: data.settings as UserSettings | undefined,
  }
}

const handleImportFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || importing.value) {
    return
  }
  importing.value = true

  try {
    let parsed: unknown
    try {
      parsed = JSON.parse(await file.text())
    } catch (error) {
      console.error(error)
      showFailToast('文件格式不正确')
      return
    }

    const payload = parseImportPayload(parsed)
    if (!payload) {
      showFailToast('导入数据无效')
      return
    }

    try {
      await showConfirmDialog({
        title: '导入数据',
        message: '导入会覆盖现有数据，是否继续？',
        confirmButtonText: '继续',
        cancelButtonText: '取消',
      })
    } catch {
      return
    }

    const normalizedSettings = normalizeImportedSettings(payload.settings)
    const normalizedRecords = payload.records
      .map(normalizeImportedRecord)
      .filter((item): item is HealthRecord => Boolean(item))

    await db.transaction('rw', db.records, db.settings, async () => {
      await db.records.clear()
      await db.settings.clear()
      if (normalizedRecords.length > 0) {
        await db.records.bulkPut(normalizedRecords)
      }
      await db.settings.put(normalizedSettings)
    })

    await Promise.all([
      healthStore.loadRecords(),
      settingsStore.reloadSettings(),
    ])
    showSuccessToast('已导入数据')
  } catch (error) {
    console.error(error)
    showFailToast('导入失败')
  } finally {
    importing.value = false
  }
}

const clearAllData = async () => {
  if (clearing.value) {
    return
  }
  clearing.value = true

  try {
    try {
      await showConfirmDialog({
        title: '清空数据',
        message: '将删除所有记录与设置，无法恢复。',
        confirmButtonText: '继续',
        cancelButtonText: '取消',
      })
    } catch {
      return
    }

    try {
      await showConfirmDialog({
        title: '再次确认',
        message: '请再次确认要清空所有数据。',
        confirmButtonText: '确认清空',
        cancelButtonText: '取消',
      })
    } catch {
      return
    }

    await db.transaction('rw', db.records, db.settings, async () => {
      await db.records.clear()
      await db.settings.clear()
    })

    await Promise.all([
      healthStore.loadRecords(),
      settingsStore.reloadSettings(),
    ])
    showSuccessToast('已清空数据')
  } catch (error) {
    console.error(error)
    showFailToast('清空失败')
  } finally {
    clearing.value = false
  }
}

onMounted(async () => {
  await settingsStore.loadSettings()
})
</script>

<template>
  <div class="page">
    <div class="section-title">用户信息</div>
    <div class="card p-3">
      <van-cell-group inset>
        <van-field
          v-model="settingsStore.settings.name"
          label="姓名"
          placeholder="请输入"
          input-align="right"
        />
        <van-field
          v-model.number="settingsStore.settings.age"
          label="年龄"
          type="number"
          placeholder="可选"
          input-align="right"
        />
      </van-cell-group>
    </div>

    <div class="section-title">正常范围</div>
    <div class="card p-3">
      <van-cell-group inset>
        <van-field
          v-model.number="settingsStore.settings.ranges.bloodPressure.systolic.min"
          label="收缩压下限"
          type="number"
          input-align="right"
        />
        <van-field
          v-model.number="settingsStore.settings.ranges.bloodPressure.systolic.max"
          label="收缩压上限"
          type="number"
          input-align="right"
        />
        <van-field
          v-model.number="settingsStore.settings.ranges.bloodPressure.diastolic.min"
          label="舒张压下限"
          type="number"
          input-align="right"
        />
        <van-field
          v-model.number="settingsStore.settings.ranges.bloodPressure.diastolic.max"
          label="舒张压上限"
          type="number"
          input-align="right"
        />

        <van-field
          v-model.number="settingsStore.settings.ranges.bloodSugar.fasting.min"
          label="空腹血糖下限"
          type="number"
          input-align="right"
        />
        <van-field
          v-model.number="settingsStore.settings.ranges.bloodSugar.fasting.max"
          label="空腹血糖上限"
          type="number"
          input-align="right"
        />
        <van-field
          v-model.number="settingsStore.settings.ranges.bloodSugar.postMeal.min"
          label="餐后血糖下限"
          type="number"
          input-align="right"
        />
        <van-field
          v-model.number="settingsStore.settings.ranges.bloodSugar.postMeal.max"
          label="餐后血糖上限"
          type="number"
          input-align="right"
        />

        <van-field
          v-model.number="settingsStore.settings.ranges.heartRate.min"
          label="心率下限"
          type="number"
          input-align="right"
        />
        <van-field
          v-model.number="settingsStore.settings.ranges.heartRate.max"
          label="心率上限"
          type="number"
          input-align="right"
        />

        <van-field
          v-model.number="settingsStore.settings.ranges.weight.min"
          label="体重下限"
          type="number"
          input-align="right"
        />
        <van-field
          v-model.number="settingsStore.settings.ranges.weight.max"
          label="体重上限"
          type="number"
          input-align="right"
        />
      </van-cell-group>
    </div>

    <div class="mt-4">
      <van-button block type="primary" @click="save">保存设置</van-button>
    </div>

    <div class="section-title mt-6">数据管理</div>
    <div class="card p-3">
      <van-cell-group inset>
        <van-cell
          title="导出数据"
          label="JSON格式"
          is-link
          @click="exportData"
        />
        <van-cell
          title="导入数据"
          label="JSON恢复（覆盖现有数据）"
          is-link
          @click="triggerImport"
        />
        <van-cell
          title="清空数据"
          label="二次确认"
          is-link
          class="text-red-600"
          @click="clearAllData"
        />
      </van-cell-group>
      <input
        ref="fileInputRef"
        type="file"
        accept="application/json"
        class="hidden"
        @change="handleImportFile"
      />
    </div>
  </div>
</template>
