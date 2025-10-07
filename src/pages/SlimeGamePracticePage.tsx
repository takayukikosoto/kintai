import { useState } from 'react'
import SlimeShooterV2 from '../components/SlimeShooterV2'

export default function SlimeGamePracticePage() {
  const [showGame, setShowGame] = useState(false)
  const [lastScore, setLastScore] = useState<number | null>(null)

  function handleGameEnd(score: number) {
    setLastScore(score)
    setShowGame(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#1a202c',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          🎮 昼食ゲーム練習場
        </h1>
        
        <p style={{
          color: '#4a5568',
          textAlign: 'center',
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          制限なしで何度でも練習できます！<br />
          新しい武器や戦略を試してみましょう。
        </p>

        {lastScore !== null && (
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
              前回のスコア
            </div>
            <div style={{ fontSize: '3rem', fontWeight: '700' }}>
              {lastScore.toLocaleString()}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowGame(true)}
          style={{
            width: '100%',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1.5rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          🎯 練習スタート
        </button>

        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: '#f7fafc',
          borderRadius: '12px',
          border: '2px solid #e2e8f0'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#2d3748' }}>
            💡 練習モードの特徴
          </h3>
          <ul style={{ color: '#4a5568', lineHeight: '2', paddingLeft: '1.5rem' }}>
            <li>回数制限なし（何度でもプレイ可能）</li>
            <li>時間制限なし（いつでもプレイ可能）</li>
            <li>スコアは記録されません</li>
            <li>報酬はありません（練習専用）</li>
          </ul>
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: '#fff5f5',
          borderRadius: '12px',
          border: '2px solid #feb2b2'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#c53030' }}>
            🎮 武器の特徴
          </h3>
          <div style={{ color: '#4a5568', lineHeight: '1.8' }}>
            <div style={{ marginBottom: '0.8rem' }}>
              <strong>💧 スライム</strong>: バランス型、ぷるぷる変形
            </div>
            <div style={{ marginBottom: '0.8rem' }}>
              <strong>🏹 矢</strong>: 高速・貫通、直線的に飛ぶ
            </div>
            <div>
              <strong>⭕ 円月輪</strong>: ゆっくり回転、戻ってくる
            </div>
          </div>
        </div>

        <a
          href="/"
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: '2rem',
            color: '#667eea',
            textDecoration: 'none',
            fontWeight: '600'
          }}
        >
          ← ホームに戻る
        </a>
      </div>

      {showGame && (
        <SlimeShooterV2
          onGameEnd={handleGameEnd}
          onClose={() => setShowGame(false)}
        />
      )}
    </div>
  )
}
