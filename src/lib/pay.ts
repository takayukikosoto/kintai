import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { TimesheetEntry } from '../types'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
const JST = 'Asia/Tokyo'

// 給与計算の設定
interface PayrollConfig {
  roundTo?: number            // 丸め単位（分）デフォルト: 15
  overtimeRate?: number       // 残業手当率 デフォルト: 1.25
  lateNightRate?: number      // 深夜手当率 デフォルト: 1.25
  holidayRate?: number        // 休日手当率 デフォルト: 1.35
  regularHours?: number       // 通常勤務時間（時間/日）デフォルト: 8
  lateNightStart?: number     // 深夜時間開始（時）デフォルト: 22
  lateNightEnd?: number       // 深夜時間終了（時）デフォルト: 5
}

const DEFAULT_CONFIG: Required<PayrollConfig> = {
  roundTo: 10,
  overtimeRate: 1.25,
  lateNightRate: 1.25,
  holidayRate: 1.35,
  regularHours: 8,
  lateNightStart: 22,
  lateNightEnd: 5
}

/**
 * 10分単位に丸める（四捨五入）
 * 例: 9:55〜10:04 → 10:00
 */
function roundToNearest(minutes: number, roundTo: number): number {
  return Math.round(minutes / roundTo) * roundTo
}

/**
 * ISO時刻を10分単位に丸めた表示用時刻に変換
 * 例: "2025-10-07 09:57:30" → "2025-10-07 10:00"
 */
export function jstRounded(isoString: string, roundTo: number = 10): string {
  const d = dayjs(isoString).tz(JST)
  const totalMinutes = d.hour() * 60 + d.minute()
  const roundedMinutes = Math.round(totalMinutes / roundTo) * roundTo
  const roundedHour = Math.floor(roundedMinutes / 60)
  const roundedMin = roundedMinutes % 60
  
  return d
    .hour(roundedHour)
    .minute(roundedMin)
    .second(0)
    .format('YYYY-MM-DD HH:mm')
}

/**
 * 深夜時間帯の分数を計算
 */
function calculateLateNightMinutes(
  start: dayjs.Dayjs,
  end: dayjs.Dayjs,
  config: Required<PayrollConfig>
): number {
  let lateNightMinutes = 0
  let current = start.clone()

  while (current.isBefore(end)) {
    const hour = current.hour()
    const nextHour = current.add(1, 'hour').startOf('hour')
    const segmentEnd = nextHour.isAfter(end) ? end : nextHour

    // 深夜時間帯かチェック（22:00-5:00）
    if (hour >= config.lateNightStart || hour < config.lateNightEnd) {
      lateNightMinutes += segmentEnd.diff(current, 'minute')
    }

    current = segmentEnd
  }

  return lateNightMinutes
}

/**
 * 休日判定（土日）
 */
function isHoliday(date: dayjs.Dayjs): boolean {
  const day = date.day()
  return day === 0 || day === 6 // 日曜日 or 土曜日
}

/**
 * 統合給与計算関数
 * クライアント・サーバー両方で使用可能
 */
export function calcPay(entry: TimesheetEntry, config: PayrollConfig = {}): TimesheetEntry {
  const conf = { ...DEFAULT_CONFIG, ...config }
  const out = { ...entry }
  let pay = 0
  let worked = 0

  if (entry.type === 'hourly' && entry.clockOut) {
    const start = dayjs.utc(entry.clockIn).tz(JST)
    const end = dayjs.utc(entry.clockOut).tz(JST)
    const baseRate = entry.hourlyRate ?? 0

    // 総勤務時間（休憩を除く）
    const totalMinutes = Math.max(0, end.diff(start, 'minute') - (entry.breaksMinutes || 0))
    
    // 15分単位に丸め
    worked = roundToNearest(totalMinutes, conf.roundTo)

    // 深夜時間を計算
    const lateNightMinutes = calculateLateNightMinutes(start, end, conf)

    // 休日判定
    const isHolidayShift = isHoliday(start)

    // 通常時間と残業時間を分ける
    const regularMinutes = Math.min(worked, conf.regularHours * 60)
    const overtimeMinutes = Math.max(0, worked - regularMinutes)

    // 給与計算
    let totalPay = 0

    if (isHolidayShift) {
      // 休日: 全時間に休日手当
      totalPay = (worked / 60) * baseRate * conf.holidayRate
    } else {
      // 通常日: 通常時間 + 残業時間
      const regularPay = (regularMinutes / 60) * baseRate
      const overtimePay = (overtimeMinutes / 60) * baseRate * conf.overtimeRate
      totalPay = regularPay + overtimePay

      // 深夜手当を追加（基本給の25%を追加）
      if (lateNightMinutes > 0) {
        const lateNightBonus = (lateNightMinutes / 60) * baseRate * (conf.lateNightRate - 1)
        totalPay += lateNightBonus
      }
    }

    pay = Math.round(totalPay)

  } else if (entry.type === 'field') {
    // 現場作業: 日当ベース
    const dayRate = entry.field?.dayRateJPY ?? 0
    const trans = entry.field?.transportJPY ?? 0
    const allow = entry.field?.allowanceJPY ?? 0
    pay = dayRate + trans + allow
    
    // 勤務時間は記録用（給与計算には影響しない）
    if (entry.clockOut) {
      const start = dayjs.utc(entry.clockIn)
      const end = dayjs.utc(entry.clockOut)
      worked = Math.max(0, end.diff(start, 'minute') - (entry.breaksMinutes || 0))
    }
  }

  out.workedMinutes = worked
  out.payJPY = pay
  return out
}

/**
 * 後方互換性のためのエイリアス
 */
export function compute(entry: TimesheetEntry): TimesheetEntry {
  return calcPay(entry)
}

export function jst(tsIsoUtc: string) {
  return dayjs.utc(tsIsoUtc).tz(JST).format('YYYY-MM-DD HH:mm')
}

export function nowIsoUtc() {
  return dayjs.utc().toISOString()
}
