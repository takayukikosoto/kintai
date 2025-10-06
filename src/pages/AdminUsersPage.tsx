import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { TimesheetEntry } from '../types'

interface UserInfo {
  email: string
  name?: string
  defaultRate?: number
}

interface UserStats {
  userId: string
  userInfo?: UserInfo
  timesheetCount: number
  totalPay: number
  totalHours: number
  lastClockIn?: string
  avgRate?: number
}

export default function AdminUsersPage() {
  const [userStats, setUserStats] = useState<UserStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'pay' | 'hours' | 'lastActivity'>('pay')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadUserStats()
  }, [])

  async function loadUserStats() {
    setLoading(true)
    try {
      // すべてのタイムシートを取得
      const q = query(
        collection(db, 'timesheets'),
        orderBy('createdAt', 'desc'),
        limit(500)
      )
      const snap = await getDocs(q)
      const timesheets: TimesheetEntry[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))

      // ユーザーIDごとに集計
      const userMap = new Map<string, UserStats>()

      for (const ts of timesheets) {
        if (!userMap.has(ts.userId)) {
          userMap.set(ts.userId, {
            userId: ts.userId,
            timesheetCount: 0,
            totalPay: 0,
            totalHours: 0
          })
        }

        const stat = userMap.get(ts.userId)!
        stat.timesheetCount++
        stat.totalPay += ts.payJPY || 0
        
        if (ts.type === 'hourly' && ts.workedMinutes) {
          stat.totalHours += ts.workedMinutes
        }

        if (!stat.lastClockIn || new Date(ts.clockIn) > new Date(stat.lastClockIn)) {
          stat.lastClockIn = ts.clockIn
        }

        if (ts.type === 'hourly' && ts.hourlyRate) {
          stat.avgRate = ts.hourlyRate // 簡易的に最新の時給を使用
        }
      }

      // ユーザー情報を取得
      const userIds = Array.from(userMap.keys())
      for (const uid of userIds) {
        try {
          const userDoc = await getDoc(doc(db, 'users', uid))
          if (userDoc.exists()) {
            const data = userDoc.data()
            const stat = userMap.get(uid)!
            stat.userInfo = {
              email: data.email || '',
              name: data.name || '',
              defaultRate: data.defaultRate
            }
          } else {
            const stat = userMap.get(uid)!
            stat.userInfo = {
              email: `UID: ${uid.slice(0, 12)}...`
            }
          }
        } catch (error) {
          const stat = userMap.get(uid)!
          stat.userInfo = {
            email: `UID: ${uid.slice(0, 12)}...`
          }
        }
      }

      setUserStats(Array.from(userMap.values()))
    } catch (error) {
      console.error('ユーザー統計の読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}時間${mins}分`
  }

  function formatDate(isoString?: string) {
    if (!isoString) return '-'
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '今日'
    if (diffDays === 1) return '昨日'
    if (diffDays < 7) return `${diffDays}日前`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`
    return `${Math.floor(diffDays / 30)}ヶ月前`
  }

  // フィルタリング
  const filteredUsers = userStats.filter(user => {
    if (!searchText) return true
    const search = searchText.toLowerCase()
    return (
      user.userInfo?.name?.toLowerCase().includes(search) ||
      user.userInfo?.email?.toLowerCase().includes(search) ||
      user.userId.toLowerCase().includes(search)
    )
  })

  // ソート
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'name':
        const nameA = a.userInfo?.name || a.userInfo?.email || a.userId
        const nameB = b.userInfo?.name || b.userInfo?.email || b.userId
        comparison = nameA.localeCompare(nameB)
        break
      case 'pay':
        comparison = a.totalPay - b.totalPay
        break
      case 'hours':
        comparison = a.totalHours - b.totalHours
        break
      case 'lastActivity':
        const dateA = a.lastClockIn ? new Date(a.lastClockIn).getTime() : 0
        const dateB = b.lastClockIn ? new Date(b.lastClockIn).getTime() : 0
        comparison = dateA - dateB
        break
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  // 統計サマリー
  const totalUsers = filteredUsers.length
  const totalPay = filteredUsers.reduce((sum, u) => sum + u.totalPay, 0)
  const totalHours = filteredUsers.reduce((sum, u) => sum + u.totalHours, 0)
  const activeUsers = filteredUsers.filter(u => {
    if (!u.lastClockIn) return false
    const daysSince = (new Date().getTime() - new Date(u.lastClockIn).getTime()) / (1000 * 60 * 60 * 24)
    return daysSince <= 30
  }).length

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1.5rem' }}>👥 ユーザー管理</h2>

      {/* 検索バー */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="🔍 ユーザー名、メールアドレスで検索..."
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

      {/* 統計サマリー */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ 
          padding: '1rem', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '0.85rem', marginBottom: '4px', opacity: 0.9 }}>総ユーザー数</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{totalUsers}人</div>
        </div>
        
        <div style={{ 
          padding: '1rem', 
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '0.85rem', marginBottom: '4px', opacity: 0.9 }}>アクティブ (30日)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{activeUsers}人</div>
        </div>

        <div style={{ 
          padding: '1rem', 
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '0.85rem', marginBottom: '4px', opacity: 0.9 }}>総支給額</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>¥{totalPay.toLocaleString()}</div>
        </div>

        <div style={{ 
          padding: '1rem', 
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          borderRadius: '12px',
          color: 'white'
        }}>
          <div style={{ fontSize: '0.85rem', marginBottom: '4px', opacity: 0.9 }}>総勤務時間</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{formatDuration(totalHours)}</div>
        </div>
      </div>

      {/* コントロール */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>📋 ユーザー一覧 ({sortedUsers.length}人)</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: '#718096' }}>並び順:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '6px 10px',
              fontSize: '0.85rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}
          >
            <option value="name">名前</option>
            <option value="pay">支給額</option>
            <option value="hours">勤務時間</option>
            <option value="lastActivity">最終活動</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            style={{
              padding: '6px 12px',
              fontSize: '0.85rem',
              background: '#e2e8f0',
              color: '#4a5568',
              minWidth: '60px'
            }}
          >
            {sortOrder === 'asc' ? '↑ 昇順' : '↓ 降順'}
          </button>
          <button
            onClick={loadUserStats}
            style={{
              padding: '6px 12px',
              fontSize: '0.85rem',
              background: '#667eea',
              color: 'white'
            }}
          >
            🔄 更新
          </button>
        </div>
      </div>

      {/* ユーザーテーブル */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
          読み込み中...
        </div>
      ) : sortedUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
          ユーザーが見つかりません
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f7fafc' }}>
                <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>ユーザー</th>
                <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '600', color: '#4a5568' }}>打刻回数</th>
                <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '600', color: '#4a5568' }}>勤務時間</th>
                <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '600', color: '#4a5568' }}>平均時給</th>
                <th style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '600', color: '#4a5568' }}>総支給額</th>
                <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: '600', color: '#4a5568' }}>最終活動</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user, idx) => (
                <tr 
                  key={user.userId}
                  style={{ 
                    borderBottom: '1px solid #f7fafc',
                    background: idx % 2 === 0 ? 'white' : '#fafbfc'
                  }}
                >
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '2px' }}>
                      {user.userInfo?.name || user.userInfo?.email?.split('@')[0] || user.userId.slice(0, 12)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                      {user.userInfo?.email}
                    </div>
                    {user.userInfo?.defaultRate && (
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                        基本時給: ¥{user.userInfo.defaultRate}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                    <span style={{ 
                      padding: '4px 10px',
                      background: '#edf2f7',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}>
                      {user.timesheetCount}回
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: '0.9rem' }}>
                    {user.totalHours > 0 ? formatDuration(user.totalHours) : '-'}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontSize: '0.9rem' }}>
                    {user.avgRate ? `¥${user.avgRate}` : '-'}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '600', fontSize: '0.95rem' }}>
                    ¥{user.totalPay.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 10px', fontSize: '0.85rem', color: '#4a5568' }}>
                    {formatDate(user.lastClockIn)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
