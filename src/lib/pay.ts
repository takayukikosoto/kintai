import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import type { TimesheetEntry } from '../types'

dayjs.extend(utc)
dayjs.extend(timezone)
const JST = 'Asia/Tokyo'

export function compute(entry: TimesheetEntry): TimesheetEntry {
  const out = { ...entry }
  let pay = 0
  let worked = 0

  if (entry.clockOut) {
    const start = dayjs.utc(entry.clockIn)
    const end = dayjs.utc(entry.clockOut)
    worked = Math.max(0, end.diff(start, 'minute') - (entry.breaksMinutes || 0))
  }

  if (entry.type === 'hourly') {
    const rate = entry.hourlyRate ?? 0
    pay = Math.round((worked / 60) * rate)
  } else if (entry.type === 'field') {
    const dayRate = entry.field?.dayRateJPY ?? 0
    const trans = entry.field?.transportJPY ?? 0
    const allow = entry.field?.allowanceJPY ?? 0
    pay = dayRate + trans + allow
  }

  out.workedMinutes = worked
  out.payJPY = pay
  return out
}

export function jst(tsIsoUtc: string) {
  return dayjs.utc(tsIsoUtc).tz(JST).format('YYYY-MM-DD HH:mm')
}

export function nowIsoUtc() {
  return dayjs.utc().toISOString()
}
