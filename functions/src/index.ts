import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)
const JST = 'Asia/Tokyo'

admin.initializeApp()
const db = admin.firestore()

export const onTimesheetWrite = functions.firestore
  .document('timesheets/{id}')
  .onWrite(async (change, context) => {
    const after = change.after.exists ? change.after.data() as any : null
    if (!after) return

    // Recompute pay defensively on backend if fields exist
    let pay = 0
    if (after.type === 'hourly' && after.clockIn && after.clockOut) {
      const start = dayjs.utc(after.clockIn)
      const end = dayjs.utc(after.clockOut)
      const worked = Math.max(0, end.diff(start, 'minute') - (after.breaksMinutes || 0))
      const rate = after.hourlyRate || 0
      pay = Math.round((worked / 60) * rate)
      await change.after.ref.update({ workedMinutes: worked, payJPY: pay, updatedAt: new Date().toISOString() })
    } else if (after.type === 'field') {
      const dayRate = after.field?.dayRateJPY || 0
      const trans = after.field?.transportJPY || 0
      const allow = after.field?.allowanceJPY || 0
      pay = dayRate + trans + allow
      await change.after.ref.update({ payJPY: pay, updatedAt: new Date().toISOString() })
    }
  })
