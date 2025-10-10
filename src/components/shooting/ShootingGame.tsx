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
          background: 'rgba(0, 0, 0, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '3rem',
            borderRadius: '20px',
            textAlign: 'center',
            color: 'white',
            maxWidth: '500px'
          }}
        >
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: '700' }}>
            🚀 スペースシューター
          </h1>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>📋 操作方法</h2>
            <ul style={{ lineHeight: '2', fontSize: '1rem', paddingLeft: '1.5rem' }}>
              <li><strong>📱 タッチ/クリック:</strong> タップした位置に移動（スマホ推奨）</li>
              <li><strong>⌨️ キーボード:</strong> ↑↓←→ または WASD で移動（PC）</li>
              <li><strong>🔫 射撃:</strong> 自動で弾が発射されます</li>
              <li><strong>🎯 目標:</strong> 敵を倒してスコアを稼ごう！</li>
            </ul>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>💡 アイテム</h2>
            <ul style={{ lineHeight: '2', fontSize: '1rem', paddingLeft: '1.5rem' }}>
              <li>💚 <strong>ハート:</strong> HP回復</li>
              <li>💰 <strong>コイン:</strong> +500点</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => setIsStarted(true)}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.3rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              🚀 ゲームスタート
            </button>

            <button
              onClick={onClose}
              style={{
                padding: '1rem 2rem',
                fontSize: '1.3rem',
                fontWeight: '700',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '2px solid white',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              ✕ 閉じる
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
