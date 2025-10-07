import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, getDocs, limit, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { jst, jstRounded } from '../lib/pay'
import AttendancePanel from '../components/AttendancePanel'
import TimesheetHistory from '../components/TimesheetHistory'
import AdminTimesheetView from '../components/AdminTimesheetView'
import SlimeShooterV2 from '../components/SlimeShooterV2'
import { showToast } from '../components/Toast'
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
  const [showSlimeGame, setShowSlimeGame] = useState(false)
  const [canPlayGame, setCanPlayGame] = useState(false)

  useEffect(() => {
    loadCurrentStatus()
    checkCanPlayGame()
    const interval = setInterval(() => {
      loadCurrentStatus()
      checkCanPlayGame()
    }, 30000) // 30秒ごとに更新
    return () => clearInterval(interval)
  }, [userId])

  async function checkCanPlayGame() {
    try {
      const now = new Date()
      const hour = now.getHours()
      
      // 12時以降のみゲーム可能
      if (hour < 12) {
        setCanPlayGame(false)
        return
      }

      // 今日既にプレイしたかチェック
      const today = new Date().toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-')

      const q = query(
        collection(db, 'slimeGames'),
        where('userId', '==', userId),
        where('date', '==', today),
        limit(1)
      )
      const snap = await getDocs(q)
      
      setCanPlayGame(snap.empty)
    } catch (error) {
      console.error('ゲーム可否チェックエラー:', error)
    }
  }

  async function handleGameEnd(score: number) {
    try {
      const today = new Date().toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-')

      // 報酬を決定（10倍厳格化）
      let reward = ''
      let rewardEmoji = ''
      
      if (score >= 60000) {
        reward = 'ゲームソフト抽選券'
        rewardEmoji = '🎮'
      } else if (score >= 40000) {
        reward = 'ウィダーインゼリー'
        rewardEmoji = '🥤'
      } else if (score >= 25000) {
        reward = 'ミネラルウォーター'
        rewardEmoji = '💧'
      } else if (score >= 15000) {
        reward = '駄菓子'
        rewardEmoji = '🍘'
      } else {
        reward = 'ティッシュ1個'
        rewardEmoji = '🧻'
      }

      // 結果を保存
      await addDoc(collection(db, 'slimeGames'), {
        userId,
        date: today,
        score,
        reward,
        rewardEmoji,
        timestamp: new Date().toISOString(),
        _ts: serverTimestamp()
      })

      showToast(`🎉 ${score}点！報酬: ${rewardEmoji} ${reward}`, 'success')
      setShowSlimeGame(false)
      setCanPlayGame(false)
    } catch (error) {
      console.error('ゲーム結果保存エラー:', error)
      showToast('結果の保存に失敗しました', 'error')
    }
  }

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

        {/* 昼食ゲームボタン */}
        {currentStatus.status === 'working' && canPlayGame && (
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={() => setShowSlimeGame(true)}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: '700',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(72, 187, 120, 0.3)',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              🍽️ 昼食ゲームで遊ぶ 💧
            </button>
            <div style={{
              marginTop: '8px',
              fontSize: '0.85rem',
              color: '#718096',
              textAlign: 'center'
            }}>
              スライムを飛ばして得点ゲット！1日1回限定
            </div>
          </div>
        )}

        {/* 練習ページへのリンク */}
        {currentStatus.status === 'working' && (
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <a
              href="/slime-practice"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: '#f7fafc',
                color: '#667eea',
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: '8px',
                textDecoration: 'none',
                border: '2px solid #667eea',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#667eea'
                e.currentTarget.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f7fafc'
                e.currentTarget.style.color = '#667eea'
              }}
            >
              🎮 昼食ゲーム練習場へ
            </a>
            <div style={{
              marginTop: '6px',
              fontSize: '0.75rem',
              color: '#a0aec0'
            }}>
              制限なし・何度でもプレイ可能
            </div>
          </div>
        )}
      </div>

      <AttendancePanel userId={userId} defaultRate={defaultRate} />
      {isAdmin ? (
        <AdminTimesheetView userId={userId} />
      ) : (
        <TimesheetHistory userId={userId} isAdmin={false} />
      )}

      {/* スライムゲームモーダル */}
      {showSlimeGame && (
        <SlimeShooterV2
          onGameEnd={handleGameEnd}
          onClose={() => setShowSlimeGame(false)}
        />
      )}
    </>
  )
}
