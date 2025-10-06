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
