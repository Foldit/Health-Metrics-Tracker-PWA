export type MetricType = 'bloodPressure' | 'bloodSugar' | 'heartRate' | 'weight'
export type BloodSugarType = 'fasting' | 'postMeal'

export interface BloodPressureValue {
  systolic: number
  diastolic: number
}

export interface BloodSugarValue {
  value: number
  subType: BloodSugarType
}

export interface HeartRateValue {
  bpm: number
}

export interface WeightValue {
  weight: number
}

export type MetricValue =
  | BloodPressureValue
  | BloodSugarValue
  | HeartRateValue
  | WeightValue

export interface HealthRecord {
  id: string
  type: MetricType
  subType?: string
  value: MetricValue
  note?: string
  datetime: number
  isAbnormal: boolean
  createdAt: number
}

export interface Range {
  min: number
  max: number
}

export interface BloodPressureRange {
  systolic: Range
  diastolic: Range
}

export interface BloodSugarRange {
  fasting: Range
  postMeal: Range
}

export interface SettingsRanges {
  bloodPressure: BloodPressureRange
  bloodSugar: BloodSugarRange
  heartRate: Range
  weight: Range
}

export interface UserSettings {
  id: string
  name: string
  age?: number
  ranges: SettingsRanges
}
