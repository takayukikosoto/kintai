import { useEffect, useRef, useState } from 'react'
import { GameCore } from './GameCore'
import type { GameStats } from './types'

interface ShootingGameProps {
  width?: number
  height?: number
  difficulty?: 'easy' | 'normal' | 'hard'
  initialStage?: number
  onGameOver: (stats: GameStats) => void
  onStageClear?: (stats: { score: number; nextStage: number }) => void
  onClose: () => void
}

export default function ShootingGame({
  width = 600,
  height = 800,
  difficulty = 'normal',
  onGameOver,
  onStageClear,
  onClose
}: ShootingGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameCore | null>(null)
  const [isStarted, setIsStarted] = useState(false)

  useEffect(() => {
    if (!canvasRef.current || !isStarted) return

    const game = new GameCore(
      canvasRef.current,
      width,
      height,
      difficulty,
      onGameOver,
      onStageClear
    )

    gameRef.current = game
    game.start()

    return () => {
      game.cleanup()
    }
  }, [isStarted, width, height, difficulty, onGameOver, onStageClear])

  if (!isStarted) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          overflow: 'auto'
        }}
      >
        <div
          style={{
            background: 'white',
            padding: '2.5rem',
            borderRadius: '24px',
            textAlign: 'center',
            maxWidth: '600px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            border: '3px solid #667eea',
            margin: '2rem'
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            marginBottom: '2rem'
          }}>
            <h1 style={{ 
              fontSize: '2.8rem', 
              marginBottom: '0.5rem', 
              fontWeight: '800',
              color: 'white',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}>
              🚀 スペースシューター
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: 'rgba(255,255,255,0.95)',
              margin: 0,
              fontWeight: '500'
            }}>
              敵を倒してハイスコアを目指せ！
            </p>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            marginBottom: '1.5rem',
            textAlign: 'left',
            border: '2px solid #10b981',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
          }}>
            <h2 style={{ 
              fontSize: '1.4rem', 
              marginBottom: '1rem',
              color: '#047857',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📋 操作方法
            </h2>
            <div style={{ 
              lineHeight: '2.2', 
              fontSize: '1.05rem',
              color: '#064e3b'
            }}>
              <div style={{
                background: 'white',
                padding: '0.8rem',
                borderRadius: '8px',
                marginBottom: '0.5rem',
                fontWeight: '600'
              }}>
                📱 <strong style={{color: '#8b5cf6'}}>タッチ/クリック:</strong> タップした位置に移動
              </div>
              <div style={{
                background: 'white',
                padding: '0.8rem',
                borderRadius: '8px',
                marginBottom: '0.5rem',
                fontWeight: '600'
              }}>
                ⌨️ <strong style={{color: '#3b82f6'}}>キーボード:</strong> ↑↓←→ / WASD で移動
              </div>
              <div style={{
                background: 'white',
                padding: '0.8rem',
                borderRadius: '8px',
                fontWeight: '600'
              }}>
                🔫 <strong style={{color: '#ef4444'}}>射撃:</strong> 自動で弾が発射！
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            marginBottom: '2rem',
            textAlign: 'left',
            border: '2px solid #f59e0b',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
          }}>
            <h2 style={{ 
              fontSize: '1.4rem', 
              marginBottom: '1rem',
              color: '#92400e',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              💎 アイテム
            </h2>
            <div style={{ 
              lineHeight: '2', 
              fontSize: '1.05rem',
              color: '#78350f'
            }}>
              <div style={{
                background: 'white',
                padding: '0.8rem',
                borderRadius: '8px',
                marginBottom: '0.5rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem'
              }}>
                <span style={{fontSize: '1.8rem'}}>💚</span>
                <div>
                  <strong style={{color: '#16a34a'}}>ハート:</strong> HP+1回復
                </div>
              </div>
              <div style={{
                background: 'white',
                padding: '0.8rem',
                borderRadius: '8px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem'
              }}>
                <span style={{fontSize: '1.8rem'}}>💰</span>
                <div>
                  <strong style={{color: '#eab308'}}>コイン:</strong> スコア+500点
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsStarted(true)}
              style={{
                padding: '1.2rem 2.5rem',
                fontSize: '1.4rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(34, 197, 94, 0.4)',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(34, 197, 94, 0.5)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(34, 197, 94, 0.4)'
              }}
            >
              🚀 START GAME
            </button>

            <button
              onClick={onClose}
              style={{
                padding: '1.2rem 2.5rem',
                fontSize: '1.4rem',
                fontWeight: '800',
                background: 'white',
                color: '#ef4444',
                border: '3px solid #ef4444',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#ef4444'
                e.currentTarget.style.color = 'white'
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'white'
                e.currentTarget.style.color = '#ef4444'
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
              }}
            >
              ✕ CLOSE
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '1rem',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            display: 'block',
            borderRadius: '8px',
            background: '#0f172a'
          }}
        />
        
        <button
          onClick={onClose}
          style={{
            marginTop: '1rem',
            padding: '0.8rem 2rem',
            fontSize: '1rem',
            fontWeight: '700',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          ✕ 終了
        </button>
      </div>
    </div>
  )
}
