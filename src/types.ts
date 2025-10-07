export type TimesheetType = 'hourly' | 'field'

export interface TimesheetEntry {
  id?: string
  userId: string
  type: TimesheetType
  clockIn: string   // ISO UTC
  clockOut?: string // ISO UTC
  breaksMinutes?: number
  // Hourly
  hourlyRate?: number
  // Field job
  field?: {
    siteName: string
    dayRateJPY: number
    transportJPY?: number
    allowanceJPY?: number
    notes?: string
  }
  // Computed
  workedMinutes?: number
  payJPY?: number
  createdAt: string // ISO UTC
  updatedAt: string // ISO UTC
}

// ========== 抽選機能 ==========

export type LotteryRarity = 'normal' | 'ssr'
export type LotterySlot = 'morning' | 'lunch'

export interface Prize {
  id?: string
  name: string
  emoji: string
  rarity: LotteryRarity
  probability: number  // パーセンテージ (例: 10 = 10%)
  enabled: boolean
  order: number
  createdAt?: string
  updatedAt?: string
}

export interface LotteryResult {
  id?: string
  userId: string
  date: string          // YYYY-MM-DD
  slot: LotterySlot     // morning or lunch
  prizeId: string | null
  prizeName: string
  prizeEmoji: string
  rarity: LotteryRarity
  timestamp: string     // ISO UTC
}

// ========== スライムゲーム ==========

export interface SlimeGameResult {
  id?: string
  userId: string
  date: string          // YYYY-MM-DD
  score: number
  reward: string        // 報酬名
  rewardEmoji: string
  timestamp: string     // ISO UTC
}
