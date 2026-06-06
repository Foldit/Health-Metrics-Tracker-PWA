import type {
  BloodPressureValue,
  BloodSugarType,
  BloodSugarValue,
  HeartRateValue,
  MetricType,
  SettingsRanges,
  WeightValue,
} from '@/types/health'

export interface ValidationResult {
  ok: boolean
  message?: string
}

export const validateBloodPressure = (
  value: BloodPressureValue
): ValidationResult => {
  if (value.systolic < 50 || value.systolic > 250) {
    return { ok: false, message: '收缩压需在 50~250 之间' }
  }
  if (value.diastolic < 30 || value.diastolic > 180) {
    return { ok: false, message: '舒张压需在 30~180 之间' }
  }
  return { ok: true }
}

export const validateBloodSugar = (value: BloodSugarValue): ValidationResult => {
  if (value.value <= 0) {
    return { ok: false, message: '血糖数值需大于 0' }
  }
  if (!value.subType) {
    return { ok: false, message: '请选择血糖类型' }
  }
  return { ok: true }
}

export const validateHeartRate = (value: HeartRateValue): ValidationResult => {
  if (value.bpm <= 0) {
    return { ok: false, message: '心率需大于 0' }
  }
  return { ok: true }
}

export const validateWeight = (value: WeightValue): ValidationResult => {
  if (value.weight <= 0) {
    return { ok: false, message: '体重需大于 0' }
  }
  return { ok: true }
}

export const isBloodPressureAbnormal = (
  value: BloodPressureValue,
  ranges: SettingsRanges['bloodPressure']
) =>
  value.systolic < ranges.systolic.min ||
  value.systolic > ranges.systolic.max ||
  value.diastolic < ranges.diastolic.min ||
  value.diastolic > ranges.diastolic.max

export const isBloodSugarAbnormal = (
  value: BloodSugarValue,
  ranges: SettingsRanges['bloodSugar'],
  subType: BloodSugarType
) => {
  const range = ranges[subType]
  return value.value < range.min || value.value > range.max
}

export const isHeartRateAbnormal = (
  value: HeartRateValue,
  ranges: SettingsRanges['heartRate']
) => value.bpm < ranges.min || value.bpm > ranges.max

export const isWeightAbnormal = (
  value: WeightValue,
  ranges: SettingsRanges['weight']
) => value.weight < ranges.min || value.weight > ranges.max

export const validateMetric = (
  type: MetricType,
  value: BloodPressureValue | BloodSugarValue | HeartRateValue | WeightValue
): ValidationResult => {
  switch (type) {
    case 'bloodPressure':
      return validateBloodPressure(value as BloodPressureValue)
    case 'bloodSugar':
      return validateBloodSugar(value as BloodSugarValue)
    case 'heartRate':
      return validateHeartRate(value as HeartRateValue)
    case 'weight':
      return validateWeight(value as WeightValue)
    default:
      return { ok: false, message: '数据类型不支持' }
  }
}
