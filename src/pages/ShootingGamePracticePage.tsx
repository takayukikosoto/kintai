import { useState } from 'react'
import ShootingGame from '../components/shooting/ShootingGame'
import type { GameStats } from '../components/shooting/types'

export default function ShootingGamePracticePage() {
  const [showGame, setShowGame] = useState(false)
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [highScore, setHighScore] = useState<number>(0)

  function handleGameOver(stats: GameStats) {
    setLastScore(stats.score)
    setShowGame(false)
    
    if (stats.score > highScore) {
      setHighScore(stats.score)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '700',
          color: '#1a202c',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          🚀 スペースシューター 練習場
        </h1>
        
        {/* ゲーム概要 */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          border: '2px solid #667eea30'
        }}>
          <h2 style={{
            fontSize: '1.3rem',
            fontWeight: '700',
            color: '#667eea',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            📖 スペースシューターとは？
          </h2>
          <p style={{
            color: '#4a5568',
            lineHeight: '1.8',
            marginBottom: '1rem'
          }}>
            宇宙空間で敵を倒すシューティングゲームです。
            キーボードで機体を操作し、スペースキーで弾を発射して敵を撃破しよう！
            制限時間内にできるだけ多くの敵を倒してハイスコアを目指しましょう。
          </p>
          <div style={{
            background: '#fef5e7',
            padding: '1rem',
            borderRadius: '8px',
            border: '2px solid #f39c12'
          }}>
            <strong style={{ color: '#f39c12' }}>💡 練習モード</strong>
            <p style={{ color: '#4a5568', marginTop: '0.5rem', marginBottom: 0 }}>
              このページでは何度でも練習できます。スコアは記録されませんが、
              操作に慣れたり、敵のパターンを覚えるのに最適です！
            </p>
          </div>
        </div>

        {/* スコア表示 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {lastScore !== null && (
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                前回のスコア
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                {lastScore.toLocaleString()}
              </div>
            </div>
          )}
          
          {highScore > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                ハイスコア
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>
                {highScore.toLocaleString()}
              </div>
            </div>
          )}
        </div>

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
          🚀 ゲームスタート
        </button>

        {/* 操作方法 */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: '#f0fff4',
          borderRadius: '12px',
          border: '2px solid #48bb78'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', color: '#2f855a' }}>
            🎮 操作方法
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                background: '#667eea',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontWeight: '700',
                minWidth: '120px',
                textAlign: 'center'
              }}>
                ↑↓←→ / WASD
              </div>
              <div style={{ color: '#4a5568' }}>
                <strong>移動:</strong> 自機を上下左右に動かします
              </div>
            </div>
            
            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                background: '#22c55e',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontWeight: '700',
                minWidth: '120px',
                textAlign: 'center'
              }}>
                スペース
              </div>
              <div style={{ color: '#4a5568' }}>
                <strong>射撃:</strong> 弾を発射して敵を攻撃します
              </div>
            </div>
          </div>
        </div>

        {/* 敵の種類 */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: '#fff7ed',
          borderRadius: '12px',
          border: '2px solid #f97316'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', color: '#c05621' }}>
            👾 敵の種類
          </h3>
          <div style={{ display: 'grid', gap: '0.8rem' }}>
            <div style={{ background: 'white', padding: '0.8rem', borderRadius: '8px' }}>
              <strong style={{ color: '#ef4444' }}>🔴 小型機 (100点)</strong>
              <p style={{ color: '#4a5568', fontSize: '0.9rem', marginTop: '0.3rem', marginBottom: 0 }}>
                まっすぐ下に降りてくる基本的な敵。HP: 2
              </p>
            </div>
            
            <div style={{ background: 'white', padding: '0.8rem', borderRadius: '8px' }}>
              <strong style={{ color: '#f97316' }}>🟠 ジグザグ機 (200点)</strong>
              <p style={{ color: '#4a5568', fontSize: '0.9rem', marginTop: '0.3rem', marginBottom: 0 }}>
                左右に揺れながら降りてくる。HP: 3
              </p>
            </div>
            
            <div style={{ background: 'white', padding: '0.8rem', borderRadius: '8px' }}>
              <strong style={{ color: '#8b5cf6' }}>🟣 射撃機 (300点)</strong>
              <p style={{ color: '#4a5568', fontSize: '0.9rem', marginTop: '0.3rem', marginBottom: 0 }}>
                プレイヤーを狙って弾を撃ってくる。HP: 4
              </p>
            </div>
            
            <div style={{ background: 'white', padding: '0.8rem', borderRadius: '8px' }}>
              <strong style={{ color: '#06b6d4' }}>🔵 高速機 (150点)</strong>
              <p style={{ color: '#4a5568', fontSize: '0.9rem', marginTop: '0.3rem', marginBottom: 0 }}>
                高速で突っ込んでくる。HP: 1
              </p>
            </div>
            
            <div style={{ background: 'white', padding: '0.8rem', borderRadius: '8px', border: '2px solid #dc2626' }}>
              <strong style={{ color: '#dc2626' }}>🔴 ボス (5000点)</strong>
              <p style={{ color: '#4a5568', fontSize: '0.9rem', marginTop: '0.3rem', marginBottom: 0 }}>
                大型の強敵。連続して弾を撃ってくる。HP: 100
              </p>
            </div>
          </div>
        </div>

        {/* アイテム */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: '#f0f9ff',
          borderRadius: '12px',
          border: '2px solid #3b82f6'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', color: '#1e40af' }}>
            💎 アイテム
          </h3>
          <div style={{ display: 'grid', gap: '0.8rem' }}>
            <div style={{ background: 'white', padding: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>💚</div>
              <div>
                <strong style={{ color: '#22c55e' }}>ハート</strong>
                <p style={{ color: '#4a5568', fontSize: '0.9rem', marginTop: '0.2rem', marginBottom: 0 }}>
                  HPを1回復します
                </p>
              </div>
            </div>
            
            <div style={{ background: 'white', padding: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>💰</div>
              <div>
                <strong style={{ color: '#eab308' }}>コイン</strong>
                <p style={{ color: '#4a5568', fontSize: '0.9rem', marginTop: '0.2rem', marginBottom: 0 }}>
                  スコア+500点
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 攻略のコツ */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: '#fef3c7',
          borderRadius: '12px',
          border: '2px solid #f59e0b'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', color: '#92400e' }}>
            💡 攻略のコツ
          </h3>
          <ul style={{ color: '#4a5568', lineHeight: '2', paddingLeft: '1.5rem' }}>
            <li><strong>小まめに動く:</strong> 敵の弾を避けながら射撃しよう</li>
            <li><strong>射撃機を優先:</strong> 弾を撃ってくる敵から倒そう</li>
            <li><strong>画面端を活用:</strong> 画面の端で待ち伏せすると安全</li>
            <li><strong>アイテムを取る:</strong> HPが減ったらハートを積極的に回収</li>
            <li><strong>ボス戦は慎重に:</strong> 弾幕を避けながら少しずつダメージを与えよう</li>
          </ul>
        </div>

        <a
          href="/"
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: '2rem',
            padding: '1rem',
            color: '#667eea',
            textDecoration: 'none',
            fontWeight: '600',
            borderRadius: '8px',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#f7fafc'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          ← ホームに戻る
        </a>
      </div>

      {showGame && (
        <ShootingGame
          onGameOver={handleGameOver}
          onClose={() => setShowGame(false)}
        />
      )}
    </div>
  )
}
