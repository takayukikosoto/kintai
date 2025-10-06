import { useState, useEffect } from 'react'
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where, orderBy, getDocs, limit } from 'firebase/firestore'
import { db } from '../firebase'
import { compute, nowIsoUtc, jst } from '../lib/pay'
import { showToast } from './Toast'
import type { TimesheetEntry } from '../types'

interface ClockCardProps {
  userId: string
  defaultRate: number
  hideTitle?: boolean
}

export default function ClockCard({ userId, defaultRate, hideTitle = false }: ClockCardProps) {
  const [active, setActive] = useState<TimesheetEntry | null>(null)
  const [rate, setRate] = useState<number>(defaultRate)
  const [breaks, setBreaks] = useState<number>(0)
  const [history, setHistory] = useState<TimesheetEntry[]>([])

  useEffect(() => {
    setRate(defaultRate)
  }, [defaultRate])

  useEffect(() => {
    (async () => {
      // find an open (no clockOut) entry
      const q = query(
        collection(db, 'timesheets'),
        where('userId', '==', userId),
        where('type', '==', 'hourly'),
        where('clockOut', '==', null),
        orderBy('createdAt', 'desc'),
        limit(1)
      )
      const snap = await getDocs(q)
      if (!snap.empty) setActive({ id: snap.docs[0].id, ...(snap.docs[0].data() as any) })
      // load last 5 for quick view
      const q2 = query(
        collection(db, 'timesheets'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(5)
      )
      const snap2 = await getDocs(q2)
      setHistory(snap2.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    })()
  }, [userId])

  async function clockIn() {
    try {
      const entry: TimesheetEntry = {
        userId,
        type: 'hourly',
        clockIn: nowIsoUtc(),
        clockOut: null as any,
        breaksMinutes: 0,
        hourlyRate: rate,
        createdAt: nowIsoUtc(),
        updatedAt: nowIsoUtc()
      }
      const ref = await addDoc(collection(db, 'timesheets'), {
        ...entry,
        clockOut: null,
        _ts: serverTimestamp()
      })
      setActive({ ...entry, id: ref.id })
      showToast('出勤しました！', 'success')
    } catch (error) {
      console.error('出勤エラー:', error)
      showToast('出勤に失敗しました', 'error')
    }
  }

  async function clockOut() {
    if (!active?.id) return
    try {
      const final = compute({
        ...active,
        clockOut: nowIsoUtc(),
        breaksMinutes: breaks
      })
      await updateDoc(doc(db, 'timesheets', active.id), {
        ...final,
        _ts: serverTimestamp()
      })
      setActive(null)
      setBreaks(0)
      showToast(`退勤しました！支給額: ¥${final.payJPY?.toLocaleString()}`, 'success')
    } catch (error) {
      console.error('退勤エラー:', error)
      showToast('退勤に失敗しました', 'error')
    }
  }

  return (
    <div className={hideTitle ? '' : 'card'}>
      {!hideTitle && <h2>⏰ 打刻（時給）</h2>}
      <div className="grid">
        <label>
          時給(円)
          <input type="number" value={rate} onChange={e => setRate(parseInt(e.target.value || '0'))} />
        </label>
        {active ? (
          <>
            <div style={{ padding: '12px', background: '#edf2f7', borderRadius: '8px', fontWeight: '500' }}>
              🟢 出勤中: {jst(active.clockIn)}
            </div>
            <label>
              休憩(分)
              <input type="number" value={breaks} onChange={e => setBreaks(parseInt(e.target.value || '0'))} />
            </label>
            <button onClick={clockOut}>退勤</button>
          </>
        ) : (
          <button onClick={clockIn}>出勤</button>
        )}
      </div>

      <h3 style={{ marginTop: 24 }}>最近の打刻（直近5件）</h3>
      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1rem', color: '#718096', fontSize: '0.9rem' }}>
          まだ打刻がありません
        </div>
      ) : (
        <ul>
          {history.map(h => (
            <li key={h.id}>
              <strong>{h.type === 'hourly' ? '⏰ 時給' : '🏗️ 現場'}</strong> / {jst(h.clockIn)} - {h.clockOut ? jst(h.clockOut) : '—'} / <strong>¥{h.payJPY ?? '-'}</strong>
            </li>
          ))}
        </ul>
      )}
      <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#718096', textAlign: 'center' }}>
        すべての履歴を見るには下の「勤怠履歴」セクションをご覧ください
      </div>
    </div>
  )
}
