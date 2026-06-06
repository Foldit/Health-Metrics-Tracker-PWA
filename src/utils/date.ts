import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

export const formatDate = (timestamp: number) =>
  dayjs(timestamp).format('YYYY年M月D日')

export const formatTime = (timestamp: number) =>
  dayjs(timestamp).format('HH:mm')

export const formatDateTime = (timestamp: number) =>
  dayjs(timestamp).format('YYYY-MM-DD HH:mm')

export const formatWeekday = (timestamp: number) =>
  dayjs(timestamp).format('dddd')

export const toInputDateTime = (timestamp: number) =>
  dayjs(timestamp).format('YYYY-MM-DDTHH:mm')
