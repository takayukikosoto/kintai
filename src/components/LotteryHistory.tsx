import { useState, useEffect } from 'react'
import { getLotteryHistory } from '../lib/lottery'
import type { LotteryResult } from '../types'

interface LotteryHistoryProps {
  userId: string
}

export default function LotteryHistory({ userId }: LotteryHistoryProps) {
  const [history, setHistory] = useState<LotteryResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [userId])

  async function loadHistory() {
    try {
      const results = await getLotteryHistory(userId, 30)
      setHistory(results)
    } catch (error) {
      console.error('抽選履歴の読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <h2>🎰 抽選履歴</h2>
        <p style={{ color: '#718096', textAlign: 'center', padding: '2rem' }}>
          読み込み中...
        </p>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="card">
        <h2>🎰 抽選履歴</h2>
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: '#718096'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎰</div>
          <p style={{ fontSize: '1.1rem' }}>まだ抽選履歴がありません</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            QRコードをスキャンして出勤すると抽選が始まります！
          </p>
        </div>
      </div>
    )
  }

  // 統計情報
  const totalDraws = history.length
  const ssrCount = history.filter(h => h.rarity === 'ssr').length
  const normalWins = history.filter(h => h.rarity === 'normal' && !h.prizeName.includes('ハズレ')).length
  const losses = history.filter(h => h.prizeName.includes('ハズレ')).length

  return (
    <div className="card">
      <h2>🎰 抽選履歴</h2>
      
      {/* 統計情報 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '12px',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{totalDraws}</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>抽選回数</div>
        </div>

        {ssrCount > 0 && (
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#7c3aed'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{ssrCount}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>🏆 SSR</div>
          </div>
        )}

        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
          borderRadius: '12px',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{normalWins}</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>当たり</div>
        </div>

        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%)',
          borderRadius: '12px',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{losses}</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>ハズレ</div>
        </div>
      </div>

      {/* 履歴リスト */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {history.map((result) => {
          const isSSR = result.rarity === 'ssr'
          const isLose = result.prizeName.includes('ハズレ')
          const date = new Date(result.timestamp)
          const slotLabel = result.slot === 'morning' ? '午前' : '午後'

          return (
            <div
              key={result.id}
              style={{
                padding: '16px',
                background: isSSR 
                  ? 'linear-gradient(135deg, #fef5e7 0%, #fff9e6 100%)'
                  : isLose
                  ? '#f7fafc'
                  : 'linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%)',
                border: isSSR 
                  ? '3px solid #ffd700'
                  : isLose
                  ? '2px solid #e2e8f0'
                  : '2px solid #48bb78',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                position: 'relative',
                boxShadow: isSSR ? '0 4px 12px rgba(255, 215, 0, 0.3)' : 'none'
              }}
            >
              {isSSR && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '16px',
                  background: '#ffd700',
                  color: '#7c3aed',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  boxShadow: '0 2px 8px rgba(255, 215, 0, 0.5)'
                }}>
                  ✨ SSR ✨
                </div>
              )}

              <div style={{
                fontSize: '3rem',
                flexShrink: 0
              }}>
                {result.prizeEmoji}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#2d3748',
                  marginBottom: '4px'
                }}>
                  {result.prizeName}
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  color: '#718096'
                }}>
                  {date.toLocaleDateString('ja-JP', { 
                    month: '2-digit', 
                    day: '2-digit' 
                  })} {slotLabel} • {date.toLocaleTimeString('ja-JP', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {isSSR && (
                <div style={{
                  fontSize: '1.5rem',
                  animation: 'pulse 2s ease-in-out infinite'
                }}>
                  🎉
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
