import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { jst } from '../lib/pay'
import type { TimesheetEntry } from '../types'

interface UserInfo {
  email: string
  name?: string
}

interface AdminTimesheetViewProps {
  userId: string
}

export default function AdminTimesheetView({ userId }: AdminTimesheetViewProps) {
  const [history, setHistory] = useState<TimesheetEntry[]>([])
  const [userMap, setUserMap] = useState<Map<string, UserInfo>>(new Map())
  const [filter, setFilter] = useState<'all' | 'hourly' | 'field'>('all')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [limitCount, setLimitCount] = useState<number>(50)
  const [loading, setLoading] = useState(false)
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')
  const [sortBy, setSortBy] = useState<'date' | 'user' | 'pay'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadHistory()
  }, [filter, limitCount])

  async function loadHistory() {
    setLoading(true)
    try {
      let q
      
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

      const snap = await getDocs(q)
      const timesheets = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
      setHistory(timesheets)

      // ユーザー情報を取得
      const userIds = [...new Set(timesheets.map(t => t.userId))]
      const newUserMap = new Map<string, UserInfo>()
      
      for (const uid of userIds) {
        try {
          const userDoc = await getDoc(doc(db, 'users', uid))
          if (userDoc.exists()) {
            const data = userDoc.data()
            newUserMap.set(uid, {
              email: data.email || '不明',
              name: data.name
            })
          } else {
            // Authから取得できないのでUIDのみ表示
            newUserMap.set(uid, {
              email: `UID: ${uid.slice(0, 8)}...`
            })
          }
        } catch (error) {
          newUserMap.set(uid, {
            email: `UID: ${uid.slice(0, 8)}...`
          })
        }
      }
      setUserMap(newUserMap)
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

  // 日付プリセット設定
  function setDatePreset(preset: string) {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const day = today.getDate()
    
    switch (preset) {
      case 'today':
        const todayStr = today.toISOString().split('T')[0]
        setDateFrom(todayStr)
        setDateTo(todayStr)
        break
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(day - today.getDay())
        setDateFrom(weekStart.toISOString().split('T')[0])
        setDateTo(today.toISOString().split('T')[0])
        break
      case 'month':
        const monthStart = new Date(year, month, 1)
        setDateFrom(monthStart.toISOString().split('T')[0])
        setDateTo(today.toISOString().split('T')[0])
        break
      case 'lastMonth':
        const lastMonthStart = new Date(year, month - 1, 1)
        const lastMonthEnd = new Date(year, month, 0)
        setDateFrom(lastMonthStart.toISOString().split('T')[0])
        setDateTo(lastMonthEnd.toISOString().split('T')[0])
        break
      case 'all':
        setDateFrom('')
        setDateTo('')
        break
    }
  }

  // フィルタリング処理
  const filteredHistory = history.filter(h => {
    // ユーザーフィルター
    if (userFilter !== 'all' && h.userId !== userFilter) return false
    
    // 日付フィルター
    if (dateFrom) {
      const hDate = new Date(h.clockIn).toISOString().split('T')[0]
      if (hDate < dateFrom) return false
    }
    
    if (dateTo) {
      const hDate = new Date(h.clockIn).toISOString().split('T')[0]
      if (hDate > dateTo) return false
    }
    
    // テキスト検索
    if (searchText) {
      const search = searchText.toLowerCase()
      const userInfo = userMap.get(h.userId)
      const userName = userInfo?.name?.toLowerCase() || ''
      const userEmail = userInfo?.email?.toLowerCase() || ''
      const siteName = h.field?.siteName?.toLowerCase() || ''
      
      if (!userName.includes(search) && 
          !userEmail.includes(search) && 
          !siteName.includes(search) &&
          !h.userId.toLowerCase().includes(search)) {
        return false
      }
    }
    
    return true
  })

  // ソート処理
  const sortedHistory = [...filteredHistory].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.clockIn).getTime() - new Date(b.clockIn).getTime()
        break
      case 'user':
        const userA = userMap.get(a.userId)?.name || userMap.get(a.userId)?.email || a.userId
        const userB = userMap.get(b.userId)?.name || userMap.get(b.userId)?.email || b.userId
        comparison = userA.localeCompare(userB)
        break
      case 'pay':
        comparison = (a.payJPY || 0) - (b.payJPY || 0)
        break
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  // ユーザーリストの取得
  const uniqueUsers = [...new Set(history.map(h => h.userId))]

  // CSV エクスポート
  function exportToCSV() {
    const headers = ['日時', 'ユーザー', 'メールアドレス', '種類', '詳細', '勤務時間(分)', '支給額']
    const rows = sortedHistory.map(h => {
      const userInfo = userMap.get(h.userId)
      return [
        jst(h.clockIn),
        userInfo?.name || '',
        userInfo?.email || '',
        h.type === 'hourly' ? '時給' : '現場',
        h.type === 'hourly' ? `¥${h.hourlyRate}/時` : h.field?.siteName || '',
        h.workedMinutes || 0,
        h.payJPY || 0
      ]
    })
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `勤怠履歴_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // 統計情報
  const totalPay = filteredHistory.reduce((sum, h) => sum + (h.payJPY || 0), 0)
  const totalHours = filteredHistory
    .filter(h => h.type === 'hourly')
    .reduce((sum, h) => sum + (h.workedMinutes || 0), 0)

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>📊 管理者: 勤怠管理</h2>
        <button 
          onClick={exportToCSV}
          style={{ 
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white',
            padding: '8px 16px',
            fontSize: '0.9rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          disabled={sortedHistory.length === 0}
        >
          📥 CSVエクスポート
        </button>
      </div>

      {/* 検索バー */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="🔍 ユーザー名、メールアドレス、現場名で検索..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '0.95rem',
            borderRadius: '8px',
            border: '2px solid #e2e8f0',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
        />
      </div>

      {/* フィルター */}
      <div style={{ 
        marginBottom: '1.5rem', 
        padding: '1rem', 
        background: '#f7fafc', 
        borderRadius: '8px',
        display: 'grid',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: '#4a5568' }}>
              種類
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
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

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: '#4a5568' }}>
              ユーザー
            </label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '0.9rem'
              }}
            >
              <option value="all">すべてのユーザー</option>
              {uniqueUsers.map(uid => (
                <option key={uid} value={uid}>
                  {userMap.get(uid)?.name || userMap.get(uid)?.email || uid.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: '#4a5568', fontWeight: '600' }}>
            📅 期間プリセット
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <button onClick={() => setDatePreset('today')} style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#e2e8f0', color: '#4a5568' }}>
              今日
            </button>
            <button onClick={() => setDatePreset('week')} style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#e2e8f0', color: '#4a5568' }}>
              今週
            </button>
            <button onClick={() => setDatePreset('month')} style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#e2e8f0', color: '#4a5568' }}>
              今月
            </button>
            <button onClick={() => setDatePreset('lastMonth')} style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#e2e8f0', color: '#4a5568' }}>
              先月
            </button>
            <button onClick={() => setDatePreset('all')} style={{ padding: '6px 12px', fontSize: '0.85rem', background: '#e2e8f0', color: '#4a5568' }}>
              全期間
            </button>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: '#4a5568' }}>
                開始日
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: '#4a5568' }}>
                終了日
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 統計サマリー */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ 
          padding: '1rem', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '0.85rem', marginBottom: '4px', opacity: 0.9 }}>合計支給額</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>¥{totalPay.toLocaleString()}</div>
        </div>
        
        <div style={{ 
          padding: '1rem', 
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '0.85rem', marginBottom: '4px', opacity: 0.9 }}>合計勤務時間</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{formatDuration(totalHours)}</div>
        </div>

        <div style={{ 
          padding: '1rem', 
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '0.85rem', marginBottom: '4px', opacity: 0.9 }}>件数</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{filteredHistory.length}件</div>
        </div>
      </div>

      {/* 履歴テーブル */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>📋 詳細履歴 ({sortedHistory.length}件)</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#718096' }}>並び順:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.85rem',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <option value="date">日時</option>
                <option value="user">ユーザー</option>
                <option value="pay">支給額</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.85rem',
                  background: '#e2e8f0',
                  color: '#4a5568',
                  minWidth: '60px'
                }}
                title={sortOrder === 'asc' ? '昇順' : '降順'}
              >
                {sortOrder === 'asc' ? '↑ 昇順' : '↓ 降順'}
              </button>
            </div>
            <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '8px', display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setLimitCount(50)}
                style={{ 
                  background: limitCount === 50 ? '#667eea' : '#e2e8f0',
                  color: limitCount === 50 ? 'white' : '#4a5568',
                  padding: '4px 12px',
                  fontSize: '0.85rem'
                }}
              >
                50件
              </button>
              <button 
                onClick={() => setLimitCount(100)}
                style={{ 
                  background: limitCount === 100 ? '#667eea' : '#e2e8f0',
                  color: limitCount === 100 ? 'white' : '#4a5568',
                  padding: '4px 12px',
                  fontSize: '0.85rem'
                }}
              >
                100件
              </button>
              <button 
                onClick={() => setLimitCount(200)}
                style={{ 
                  background: limitCount === 200 ? '#667eea' : '#e2e8f0',
                  color: limitCount === 200 ? 'white' : '#4a5568',
                  padding: '4px 12px',
                  fontSize: '0.85rem'
                }}
              >
                200件
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>読み込み中...</div>
        ) : sortedHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
            該当する履歴がありません
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f7fafc' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>日時</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>ユーザー</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>種類</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>詳細</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '600', color: '#4a5568' }}>勤務時間</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '600', color: '#4a5568' }}>支給額</th>
                </tr>
              </thead>
              <tbody>
                {sortedHistory.map((h, idx) => (
                  <tr 
                    key={h.id}
                    style={{ 
                      borderBottom: '1px solid #f7fafc',
                      background: idx % 2 === 0 ? 'white' : '#fafbfc'
                    }}
                  >
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ fontSize: '0.9rem' }}>{jst(h.clockIn).split(' ')[0]}</div>
                      <div style={{ fontSize: '0.8rem', color: '#718096' }}>{jst(h.clockIn).split(' ')[1]}</div>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                        {userMap.get(h.userId)?.name || userMap.get(h.userId)?.email?.split('@')[0] || h.userId.slice(0, 8)}
                      </div>
                      {userMap.get(h.userId)?.name && (
                        <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                          {userMap.get(h.userId)?.email}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ 
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        background: h.type === 'hourly' ? '#e6fffa' : '#fef5e7',
                        color: h.type === 'hourly' ? '#2c7a7b' : '#d69e2e'
                      }}>
                        {h.type === 'hourly' ? '⏰ 時給' : '🏗️ 現場'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', fontSize: '0.85rem', color: '#4a5568' }}>
                      {h.type === 'hourly' ? (
                        <>
                          ¥{h.hourlyRate}/時
                          {h.breaksMinutes ? ` (休憩${h.breaksMinutes}分)` : ''}
                        </>
                      ) : (
                        <>
                          {h.field?.siteName || '-'}
                          {h.field?.transportJPY ? ` +交通費¥${h.field.transportJPY}` : ''}
                        </>
                      )}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: '0.85rem' }}>
                      {h.type === 'hourly' ? formatDuration(h.workedMinutes) : '-'}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '600', fontSize: '0.95rem' }}>
                      ¥{(h.payJPY || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
