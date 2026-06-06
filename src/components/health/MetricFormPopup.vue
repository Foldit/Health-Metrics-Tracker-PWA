<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { showFailToast } from 'vant'
import { useHealthStore } from '@/stores/healthStore'
import { useSettingsStore } from '@/stores/settingsStore'
import type {
  BloodSugarType,
  HealthRecord,
  MetricType,
} from '@/types/health'
import {
  isBloodPressureAbnormal,
  isBloodSugarAbnormal,
  isHeartRateAbnormal,
  isWeightAbnormal,
  validateMetric,
} from '@/services/validation'
import { toInputDateTime } from '@/utils/date'
import SuccessMark from '@/components/animations/SuccessMark.vue'

const props = defineProps<{
  show: boolean
  metricType: MetricType
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const popupVisible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const healthStore = useHealthStore()
const settingsStore = useSettingsStore()

const isSaving = ref(false)
const showSuccess = ref(false)

const formState = reactive({
  systolic: '',
  diastolic: '',
  sugar: '',
  sugarType: 'fasting' as BloodSugarType,
  bpm: '',
  weight: '',
  datetime: '',
  note: '',
})

const showDateTimePicker = ref(false)
const dateValue = ref<string[]>([])
const timeValue = ref<string[]>([])

const metricTitle = computed(() => {
  switch (props.metricType) {
    case 'bloodPressure':
      return '血压'
    case 'bloodSugar':
      return '血糖'
    case 'heartRate':
      return '心率'
    case 'weight':
      return '体重'
    default:
      return ''
  }
})

const resetForm = () => {
  formState.systolic = ''
  formState.diastolic = ''
  formState.sugar = ''
  formState.sugarType = 'fasting'
  formState.bpm = ''
  formState.weight = ''
  formState.note = ''
  formState.datetime = toInputDateTime(Date.now())
}

const datetimeDisplay = computed(() =>
  formState.datetime
    ? dayjs(formState.datetime).format('YYYY-MM-DD HH:mm')
    : '请选择'
)

const openDateTimePicker = () => {
  const base = formState.datetime ? dayjs(formState.datetime) : dayjs()
  dateValue.value = [base.format('YYYY'), base.format('MM'), base.format('DD')]
  timeValue.value = [base.format('HH'), base.format('mm')]
  showDateTimePicker.value = true
}

const applyDateTime = () => {
  const [year, month, day] = dateValue.value
  const [hour, minute] = timeValue.value
  const candidate = dayjs(
    `${year}-${month}-${day} ${hour}:${minute}`,
    'YYYY-MM-DD HH:mm'
  )
  if (!candidate.isValid()) {
    showFailToast('请选择时间')
    return
  }
  formState.datetime = candidate.format('YYYY-MM-DDTHH:mm')
  showDateTimePicker.value = false
}

watch(
  () => props.show,
  (value) => {
    if (value) {
      resetForm()
    }
  }
)

const buildRecord = () => {
  const datetime = new Date(formState.datetime).getTime()
  if (Number.isNaN(datetime)) {
    showFailToast('请选择时间')
    return null
  }

  const ranges = settingsStore.settings.ranges
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}`

  if (props.metricType === 'bloodPressure') {
    const value = {
      systolic: Number(formState.systolic),
      diastolic: Number(formState.diastolic),
    }
    const validation = validateMetric('bloodPressure', value)
    if (!validation.ok) {
      showFailToast(validation.message ?? '输入有误')
      return null
    }
    return {
      id,
      type: 'bloodPressure',
      value,
      datetime,
      note: formState.note,
      isAbnormal: isBloodPressureAbnormal(value, ranges.bloodPressure),
      createdAt: Date.now(),
    } as HealthRecord
  }

  if (props.metricType === 'bloodSugar') {
    const value = {
      value: Number(formState.sugar),
      subType: formState.sugarType,
    }
    const validation = validateMetric('bloodSugar', value)
    if (!validation.ok) {
      showFailToast(validation.message ?? '输入有误')
      return null
    }
    return {
      id,
      type: 'bloodSugar',
      subType: formState.sugarType,
      value,
      datetime,
      note: formState.note,
      isAbnormal: isBloodSugarAbnormal(
        value,
        ranges.bloodSugar,
        formState.sugarType
      ),
      createdAt: Date.now(),
    } as HealthRecord
  }

  if (props.metricType === 'heartRate') {
    const value = {
      bpm: Number(formState.bpm),
    }
    const validation = validateMetric('heartRate', value)
    if (!validation.ok) {
      showFailToast(validation.message ?? '输入有误')
      return null
    }
    return {
      id,
      type: 'heartRate',
      value,
      datetime,
      note: formState.note,
      isAbnormal: isHeartRateAbnormal(value, ranges.heartRate),
      createdAt: Date.now(),
    } as HealthRecord
  }

  const value = {
    weight: Number(formState.weight),
  }
  const validation = validateMetric('weight', value)
  if (!validation.ok) {
    showFailToast(validation.message ?? '输入有误')
    return null
  }
  return {
    id,
    type: 'weight',
    value,
    datetime,
    note: formState.note,
    isAbnormal: isWeightAbnormal(value, ranges.weight),
    createdAt: Date.now(),
  } as HealthRecord
}

const onSubmit = async () => {
  if (isSaving.value) return
  isSaving.value = true
  try {
    await settingsStore.loadSettings()
    const record = buildRecord()
    if (!record) {
      return
    }

    await healthStore.addRecord(record)
    showSuccess.value = true

    setTimeout(() => {
      showSuccess.value = false
      popupVisible.value = false
    }, 850)
  } catch (error) {
    console.error('Failed to save record', error)
    showFailToast('保存失败，请重试')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <van-popup
    v-model:show="popupVisible"
    position="bottom"
    round
    :close-on-click-overlay="false"
    :lock-scroll="!showDateTimePicker"
  >
    <div class="p-4 relative">
      <div class="text-lg font-semibold mb-2">{{ metricTitle }}录入</div>
      <van-form @submit="onSubmit">
        <template v-if="metricType === 'bloodPressure'">
          <van-field
            v-model="formState.systolic"
            type="number"
            label="收缩压"
            placeholder="50 ~ 250"
            input-align="right"
          />
          <van-field
            v-model="formState.diastolic"
            type="number"
            label="舒张压"
            placeholder="30 ~ 180"
            input-align="right"
          />
        </template>

        <template v-else-if="metricType === 'bloodSugar'">
          <van-field
            v-model="formState.sugar"
            type="number"
            label="血糖"
            placeholder="请输入数值"
            input-align="right"
          />
          <van-field label="类型">
            <template #input>
              <van-radio-group v-model="formState.sugarType" direction="horizontal">
                <van-radio name="fasting">空腹</van-radio>
                <van-radio name="postMeal">餐后</van-radio>
              </van-radio-group>
            </template>
          </van-field>
        </template>

        <template v-else-if="metricType === 'heartRate'">
          <van-field
            v-model="formState.bpm"
            type="number"
            label="心率"
            placeholder="BPM"
            input-align="right"
          />
        </template>

        <template v-else>
          <van-field
            v-model="formState.weight"
            type="number"
            label="体重"
            placeholder="公斤"
            input-align="right"
          />
        </template>

        <van-field
          :model-value="datetimeDisplay"
          label="时间"
          input-align="right"
          readonly
          is-link
          @click="openDateTimePicker"
        />
        <van-field
          v-model="formState.note"
          type="textarea"
          rows="2"
          autosize
          label="备注"
          placeholder="可选"
        />

        <div class="mt-4 flex gap-3">
          <van-button class="flex-1" type="default" @click="popupVisible = false">
            取消
          </van-button>
          <van-button
            class="flex-1"
            type="primary"
            native-type="submit"
            :loading="isSaving"
          >
            保存记录
          </van-button>
        </div>
      </van-form>
    </div>
    <SuccessMark :show="showSuccess" />
  </van-popup>

  <van-popup
    v-model:show="showDateTimePicker"
    position="bottom"
    round
    :style="{ height: '70vh' }"
  >
    <div class="p-4 h-full flex flex-col">
      <div class="flex items-center justify-between mb-2">
        <van-button size="small" type="default" @click="showDateTimePicker = false">
          取消
        </van-button>
        <div class="text-sm font-semibold">选择时间</div>
        <van-button size="small" type="primary" @click="applyDateTime">
          确定
        </van-button>
      </div>
      <div class="flex-1 overflow-y-auto">
        <van-date-picker v-model="dateValue" :show-toolbar="false" />
        <div class="h-3"></div>
        <van-time-picker
          v-model="timeValue"
          :columns-type="['hour', 'minute']"
          :show-toolbar="false"
        />
      </div>
    </div>
  </van-popup>
</template>
