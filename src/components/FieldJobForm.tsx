import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { compute, nowIsoUtc } from '../lib/pay'
import { showToast } from './Toast'
import type { TimesheetEntry } from '../types'

interface FieldJobFormProps {
  userId: string
  hideTitle?: boolean
}

export default function FieldJobForm({ userId, hideTitle = false }: FieldJobFormProps) {
  const [siteName, setSiteName] = useState('')
  const [dayRate, setDayRate] = useState<number>(15000)
  const [transport, setTransport] = useState<number>(0)
  const [allowance, setAllowance] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit() {
    // バリデーション
    if (!siteName.trim()) {
      showToast('現場名を入力してください', 'warning')
      return
    }
    if (dayRate <= 0) {
      showToast('日当を入力してください', 'warning')
      return
    }

    setLoading(true)
    try {
      const base: TimesheetEntry = {
        userId,
        type: 'field',
        clockIn: nowIsoUtc(),
        clockOut: nowIsoUtc(),
        createdAt: nowIsoUtc(),
        updatedAt: nowIsoUtc(),
        field: {
          siteName,
          dayRateJPY: dayRate,
          transportJPY: transport,
          allowanceJPY: allowance,
          notes
        }
      }
      const entry = compute(base)
      const ref = await addDoc(collection(db, 'timesheets'), { ...entry, _ts: serverTimestamp() })
      setSubmitted(ref.id)
      showToast(`現場作業を保存しました！支給額: ¥${entry.payJPY?.toLocaleString()}`, 'success')
      
      // フォームをリセット
      setTimeout(() => {
        setSiteName('')
        setNotes('')
        setSubmitted(null)
      }, 2000)

      try {
        const url = import.meta.env.VITE_WEBHOOK_URL
        if (url) {
          await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) })
        }
      } catch (err) {
        console.warn('Webhook送信エラー:', err)
      }
    } catch (error) {
      console.error('保存エラー:', error)
      showToast('保存に失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={hideTitle ? '' : 'card'}>
      {!hideTitle && <h2>🏗️ 現場（定額・手当）申請</h2>}
      <div className="grid">
        <label>現場名<input value={siteName} onChange={e => setSiteName(e.target.value)} /></label>
        <label>日当(円)<input type="number" value={dayRate} onChange={e => setDayRate(parseInt(e.target.value || '0'))} /></label>
        <label>交通費(円)<input type="number" value={transport} onChange={e => setTransport(parseInt(e.target.value || '0'))} /></label>
        <label>手当(円)<input type="number" value={allowance} onChange={e => setAllowance(parseInt(e.target.value || '0'))} /></label>
        <label>備考<textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} /></label>
        <button onClick={submit} disabled={loading}>
          {loading ? '保存中...' : '保存'}
        </button>
        {submitted && <div className="success-message">✓ 保存しました</div>}
      </div>
    </div>
  )
}
