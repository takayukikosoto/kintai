import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore'
import { db } from '../firebase'
import { jst, jstRounded } from '../lib/pay'
import AttendancePanel from '../components/AttendancePanel'
import TimesheetHistory from '../components/TimesheetHistory'
import AdminTimesheetView from '../components/AdminTimesheetView'
import type { TimesheetEntry } from '../types'

interface HomePageProps {
  userId: string
  defaultRate: number
  isAdmin?: boolean
}

export default function HomePage({ userId, defaultRate, isAdmin = false }: HomePageProps) {
  const [currentStatus, setCurrentStatus] = useState<{
    status: 'before' | 'working' | 'after'
    entry?: TimesheetEntry
  }>({ status: 'before' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCurrentStatus()
    const interval = setInterval(loadCurrentStatus, 30000) // 30秒ごとに更新
    return () => clearInterval(interval)
  }, [userId])

  async function loadCurrentStatus() {
    try {
      // 今日の出勤記録を取得
      const q = query(
        collection(db, 'timesheets'),
        where('userId', '==', userId),
        where('type', '==', 'hourly'),
        where('clockOut', '==', null),
        orderBy('createdAt', 'desc'),
        limit(1)
      )
      const snap = await getDocs(q)

      if (!snap.empty) {
        // 出勤中
        setCurrentStatus({
          status: 'working',
          entry: { id: snap.docs[0].id, ...(snap.docs[0].data() as any) }
        })
      } else {
        // 退勤済みまたは出勤前
        // 今日退勤したかチェック
        const today = new Date().toLocaleDateString('ja-JP', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit' 
        }).replace(/\//g, '-')

        const q2 = query(
          collection(db, 'timesheets'),
          where('userId', '==', userId),
          where('type', '==', 'hourly'),
          orderBy('createdAt', 'desc'),
          limit(1)
        )
        const snap2 = await getDocs(q2)
        
        if (!snap2.empty) {
          const lastEntry = snap2.docs[0].data() as TimesheetEntry
          const lastDate = jst(lastEntry.clockIn).split(' ')[0]
          
          if (lastDate === today && lastEntry.clockOut) {
            // 今日退勤済み
            setCurrentStatus({ status: 'after', entry: lastEntry })
          } else {
            // 出勤前
            setCurrentStatus({ status: 'before' })
          }
        } else {
          setCurrentStatus({ status: 'before' })
        }
      }
    } catch (error) {
      console.error('ステータス取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusDisplay = () => {
    if (loading) {
      return { icon: '⏳', text: '読み込み中...', color: '#718096', bg: '#f7fafc' }
    }
    
    switch (currentStatus.status) {
      case 'before':
        return { icon: '🌅', text: '出勤前', color: '#3182ce', bg: 'linear-gradient(135deg, #ebf8ff 0%, #e6fffa 100%)' }
      case 'working':
        return { icon: '💼', text: '出勤中', color: '#38a169', bg: 'linear-gradient(135deg, #f0fff4 0%, #fefcbf 100%)' }
      case 'after':
        return { icon: '🌙', text: '退勤済み', color: '#805ad5', bg: 'linear-gradient(135deg, #faf5ff 0%, #e9d8fd 100%)' }
    }
  }

  const statusDisplay = getStatusDisplay()

  return (
    <>
      {/* ステータス表示 */}
      <div className="card" style={{ 
        textAlign: 'center',
        background: statusDisplay.bg,
        border: `3px solid ${statusDisplay.color}20`
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>
          {statusDisplay.icon}
        </div>
        <h2 style={{ 
          fontSize: '2rem', 
          color: statusDisplay.color,
          marginBottom: '1rem'
        }}>
          {statusDisplay.text}
        </h2>
        {currentStatus.entry && (
          <div style={{ 
            fontSize: '1.1rem', 
            color: '#4a5568',
            background: 'white',
            padding: '16px',
            borderRadius: '12px',
            display: 'inline-block',
            minWidth: '300px'
          }}>
            {currentStatus.status === 'working' ? (
              <>
                <div style={{ marginBottom: '8px' }}>
                  <strong>出勤時刻：</strong>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: statusDisplay.color }}>
                  {jstRounded(currentStatus.entry.clockIn).split(' ')[1]}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>
                  (実際: {jst(currentStatus.entry.clockIn).split(' ')[1]})
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'grid', gap: '8px', textAlign: 'left' }}>
                  <div>
                    <strong>出勤：</strong> {jstRounded(currentStatus.entry.clockIn).split(' ')[1]}
                    <span style={{ fontSize: '0.8rem', color: '#718096', marginLeft: '8px' }}>
                      ({jst(currentStatus.entry.clockIn).split(' ')[1]})
                    </span>
                  </div>
                  <div>
                    <strong>退勤：</strong> {jstRounded(currentStatus.entry.clockOut!).split(' ')[1]}
                    <span style={{ fontSize: '0.8rem', color: '#718096', marginLeft: '8px' }}>
                      ({jst(currentStatus.entry.clockOut!).split(' ')[1]})
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <AttendancePanel userId={userId} defaultRate={defaultRate} />
      {isAdmin ? (
        <AdminTimesheetView userId={userId} />
      ) : (
        <TimesheetHistory userId={userId} isAdmin={false} />
      )}
    </>
  )
}
