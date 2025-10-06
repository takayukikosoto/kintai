import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { jst } from '../lib/pay'
import type { TimesheetEntry } from '../types'

interface TimesheetHistoryProps {
  userId: string
  isAdmin?: boolean
}

export default function TimesheetHistory({ userId, isAdmin = false }: TimesheetHistoryProps) {
  const [history, setHistory] = useState<TimesheetEntry[]>([])
  const [filter, setFilter] = useState<'all' | 'hourly' | 'field'>('all')
  const [limitCount, setLimitCount] = useState<number>(30)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [userId, isAdmin, filter, limitCount])

  async function loadHistory() {
    setLoading(true)
    try {
      let q
      
      if (isAdmin) {
        // 管理者: 全員のタイムシートを取得
        if (filter !== 'all') {
          q = query(
            collection(db, 'timesheets'),
            where('type', '==', filter),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
          )
        } else {
          q = query(
            collection(db, 'timesheets'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
          )
        }
      } else {
        // 一般ユーザー: 自分のタイムシートのみ
        if (filter !== 'all') {
          q = query(
            collection(db, 'timesheets'),
            where('userId', '==', userId),
            where('type', '==', filter),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
          )
        } else {
          q = query(
            collection(db, 'timesheets'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
          )
        }
      }

      const snap = await getDocs(q)
      setHistory(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    } catch (error) {
      console.error('履歴の読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatDuration(minutes?: number) {
    if (!minutes) return '-'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}時間${mins}分`
  }

  const totalPay = history.reduce((sum, h) => sum + (h.payJPY || 0), 0)

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>📊 勤怠履歴</h2>
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button 
            onClick={() => setFilter('all')}
            style={{ 
              background: filter === 'all' ? '#667eea' : '#e2e8f0',
              color: filter === 'all' ? 'white' : '#4a5568',
              padding: '6px 12px',
              fontSize: '0.9rem'
            }}
          >
            すべて
          </button>
          <button 
            onClick={() => setFilter('hourly')}
            style={{ 
              background: filter === 'hourly' ? '#667eea' : '#e2e8f0',
              color: filter === 'hourly' ? 'white' : '#4a5568',
              padding: '6px 12px',
              fontSize: '0.9rem'
            }}
          >
            時給
          </button>
          <button 
            onClick={() => setFilter('field')}
            style={{ 
              background: filter === 'field' ? '#667eea' : '#e2e8f0',
              color: filter === 'field' ? 'white' : '#4a5568',
              padding: '6px 12px',
              fontSize: '0.9rem'
            }}
          >
            現場
          </button>
        </div>
      </div>

      <div style={{ 
        padding: '16px', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        borderRadius: '12px',
        color: 'white',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>表示期間の合計支給額</div>
        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>¥{totalPay.toLocaleString()}</div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>読み込み中...</div>
      ) : history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>履歴がありません</div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>日付</th>
                  {isAdmin && <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>ユーザー</th>}
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>種類</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>詳細</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: '#4a5568' }}>勤務時間</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: '#4a5568' }}>支給額</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, idx) => (
                  <tr 
                    key={h.id}
                    style={{ 
                      borderBottom: '1px solid #f7fafc',
                      background: idx % 2 === 0 ? 'white' : '#f7fafc'
                    }}
                  >
                    <td style={{ padding: '12px 8px', fontSize: '0.9rem' }}>
                      {jst(h.clockIn).split(' ')[0]}
                      <br />
                      <span style={{ fontSize: '0.8rem', color: '#718096' }}>
                        {jst(h.clockIn).split(' ')[1]}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '12px 8px', fontSize: '0.85rem', color: '#4a5568' }}>
                        {h.userId?.slice(0, 8)}...
                      </td>
                    )}
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ 
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        background: h.type === 'hourly' ? '#e6fffa' : '#fef5e7',
                        color: h.type === 'hourly' ? '#2c7a7b' : '#d69e2e'
                      }}>
                        {h.type === 'hourly' ? '⏰ 時給' : '🏗️ 現場'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: '0.9rem' }}>
                      {h.type === 'hourly' ? (
                        <>
                          時給 ¥{h.hourlyRate}
                          {h.breaksMinutes ? <span style={{ color: '#718096' }}> (休憩{h.breaksMinutes}分)</span> : ''}
                        </>
                      ) : (
                        <>
                          {h.field?.siteName || '-'}
                          {h.field?.transportJPY ? <span style={{ color: '#718096' }}> (+交通費)</span> : ''}
                        </>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '0.9rem' }}>
                      {h.type === 'hourly' ? formatDuration(h.workedMinutes) : '-'}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: '#2d3748' }}>
                      ¥{(h.payJPY || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button 
              onClick={() => setLimitCount(30)}
              style={{ 
                background: limitCount === 30 ? '#667eea' : '#e2e8f0',
                color: limitCount === 30 ? 'white' : '#4a5568',
                padding: '6px 16px',
                fontSize: '0.9rem'
              }}
            >
              30件
            </button>
            <button 
              onClick={() => setLimitCount(50)}
              style={{ 
                background: limitCount === 50 ? '#667eea' : '#e2e8f0',
                color: limitCount === 50 ? 'white' : '#4a5568',
                padding: '6px 16px',
                fontSize: '0.9rem'
              }}
            >
              50件
            </button>
            <button 
              onClick={() => setLimitCount(100)}
              style={{ 
                background: limitCount === 100 ? '#667eea' : '#e2e8f0',
                color: limitCount === 100 ? 'white' : '#4a5568',
                padding: '6px 16px',
                fontSize: '0.9rem'
              }}
            >
              100件
            </button>
          </div>
        </>
      )}
    </div>
  )
}
