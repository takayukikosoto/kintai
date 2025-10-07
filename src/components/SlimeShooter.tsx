import { useState, useRef, useEffect } from 'react'

interface Target {
  id: number
  x: number
  y: number
  points: number
  emoji: string
  hit: boolean
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

interface SlimeShooterProps {
  onGameEnd: (score: number) => void
  onClose: () => void
}

export default function SlimeShooter({ onGameEnd, onClose }: SlimeShooterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<'ready' | 'aiming' | 'shooting' | 'ended'>('ready')
  const [score, setScore] = useState(0)
  const [attemptsLeft, setAttemptsLeft] = useState(3)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null)
  
  const slimeRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, active: false })
  const targetsRef = useRef<Target[]>([])
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>()
  const scoreRef = useRef(0)

  const CANVAS_WIDTH = 400
  const CANVAS_HEIGHT = 600
  const SLIME_START_Y = 550
  const GRAVITY = 0.3
  const MAX_DRAG_DISTANCE = 100

  useEffect(() => {
    initTargets()
    startGameLoop()
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  function initTargets() {
    const targets: Target[] = []
    const emojis = ['⭐', '💎', '💰', '🌟', '✨']
    const pointValues = [50, 100, 200, 100, 50]

    for (let i = 0; i < 10; i++) {
      const emojiIndex = Math.floor(Math.random() * emojis.length)
      targets.push({
        id: i,
        x: 50 + Math.random() * (CANVAS_WIDTH - 100),
        y: 50 + Math.random() * 300,
        points: pointValues[emojiIndex],
        emoji: emojis[emojiIndex],
        hit: false
      })
    }
    targetsRef.current = targets
  }

  function startGameLoop() {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function animate() {
      if (!ctx || !canvas) return

      // Clear
      ctx.fillStyle = '#1a202c'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      // Draw targets
      targetsRef.current.forEach(target => {
        if (!target.hit) {
          ctx.font = '32px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(target.emoji, target.x, target.y)
          
          // Points label
          ctx.font = '12px Arial'
          ctx.fillStyle = '#ffd700'
          ctx.fillText(`${target.points}`, target.x, target.y + 20)
        }
      })

      // Update and draw slime
      const slime = slimeRef.current
      if (slime.active) {
        slime.vy += GRAVITY
        slime.x += slime.vx
        slime.y += slime.vy

        // Check collisions
        targetsRef.current.forEach(target => {
          if (!target.hit) {
            const dx = slime.x - target.x
            const dy = slime.y - target.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance < 30) {
              target.hit = true
              scoreRef.current += target.points
              setScore(scoreRef.current)
              createParticles(target.x, target.y, target.points >= 100 ? '#ffd700' : '#60a5fa')
            }
          }
        })

        // Out of bounds
        if (slime.y < -50 || slime.x < -50 || slime.x > CANVAS_WIDTH + 50) {
          slime.active = false
          setGameState('ready')
        }
      }

      // Draw slime
      if (slime.active || gameState === 'ready' || gameState === 'aiming') {
        const displayY = slime.active ? slime.y : SLIME_START_Y
        const displayX = slime.active ? slime.x : CANVAS_WIDTH / 2
        
        // 引っ張り中のスライム変形
        if (gameState === 'aiming' && dragStart && dragCurrent) {
          const dx = dragCurrent.x - CANVAS_WIDTH / 2
          const dy = dragCurrent.y - SLIME_START_Y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const stretch = Math.min(distance / 50, 2)
          
          // 伸びたスライムを描画
          ctx.save()
          ctx.translate(CANVAS_WIDTH / 2, SLIME_START_Y)
          ctx.scale(1 + stretch * 0.3, 1 - stretch * 0.2)
          ctx.font = '48px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('💧', 0, 0)
          ctx.restore()
        } else {
          ctx.font = '48px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('💧', displayX, displayY)
        }
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.2
        p.life -= 1

        if (p.life > 0) {
          ctx.fillStyle = p.color
          ctx.globalAlpha = p.life / 30
          ctx.beginPath()
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
          return true
        }
        return false
      })

      // Draw aim line
      if (gameState === 'aiming' && dragStart && dragCurrent) {
        ctx.strokeStyle = '#60a5fa'
        ctx.lineWidth = 3
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(CANVAS_WIDTH / 2, SLIME_START_Y)
        ctx.lineTo(dragCurrent.x, dragCurrent.y)
        ctx.stroke()
        ctx.setLineDash([])

        // Power indicator
        const dx = dragCurrent.x - CANVAS_WIDTH / 2
        const dy = dragCurrent.y - SLIME_START_Y
        const distance = Math.min(Math.sqrt(dx * dx + dy * dy), MAX_DRAG_DISTANCE)
        const power = (distance / MAX_DRAG_DISTANCE) * 100

        ctx.fillStyle = '#ffd700'
        ctx.font = '16px Arial'
        ctx.fillText(`パワー: ${Math.floor(power)}%`, CANVAS_WIDTH / 2, SLIME_START_Y + 40)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()
  }

  function createParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 4
      particlesRef.current.push({
        id: Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        color
      })
    }
  }

  function handleStart(clientX: number, clientY: number) {
    if (gameState !== 'ready' || attemptsLeft <= 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    setDragStart({ x, y })
    setDragCurrent({ x, y })
    setGameState('aiming')
  }

  function handleMove(clientX: number, clientY: number) {
    if (gameState !== 'aiming' || !dragStart) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top

    setDragCurrent({ x, y })
  }

  function handleEnd() {
    if (gameState !== 'aiming' || !dragStart || !dragCurrent) return

    const dx = dragCurrent.x - CANVAS_WIDTH / 2
    const dy = dragCurrent.y - SLIME_START_Y
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), MAX_DRAG_DISTANCE)

    // Invert direction (pull back = shoot forward)
    const angle = Math.atan2(-dy, -dx)
    const power = (distance / MAX_DRAG_DISTANCE) * 20

    slimeRef.current = {
      x: CANVAS_WIDTH / 2,
      y: SLIME_START_Y,
      vx: Math.cos(angle) * power,
      vy: Math.sin(angle) * power,
      active: true
    }

    setGameState('shooting')
    setAttemptsLeft(prev => prev - 1)
    setDragStart(null)
    setDragCurrent(null)

    // Check if game ended
    setTimeout(() => {
      if (attemptsLeft - 1 <= 0) {
        setGameState('ended')
        setTimeout(() => onGameEnd(scoreRef.current), 1000)
      } else {
        setGameState('ready')
      }
    }, 3000)
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20000
      }}
    >
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '16px',
        borderRadius: '12px 12px 0 0',
        width: CANVAS_WIDTH,
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>💧 スライムシューター</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>残り: {attemptsLeft}回</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>スコア</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{score}</div>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onTouchStart={(e) => {
          e.preventDefault()
          const touch = e.touches[0]
          handleStart(touch.clientX, touch.clientY)
        }}
        onTouchMove={(e) => {
          e.preventDefault()
          const touch = e.touches[0]
          handleMove(touch.clientX, touch.clientY)
        }}
        onTouchEnd={(e) => {
          e.preventDefault()
          handleEnd()
        }}
        style={{
          border: '3px solid #667eea',
          cursor: gameState === 'ready' ? 'grab' : gameState === 'aiming' ? 'grabbing' : 'default',
          touchAction: 'none'
        }}
      />

      {/* Instructions */}
      <div style={{
        background: '#2d3748',
        padding: '16px',
        borderRadius: '0 0 12px 12px',
        width: CANVAS_WIDTH,
        color: 'white',
        textAlign: 'center'
      }}>
        {gameState === 'ready' && (
          <div style={{ fontSize: '0.95rem' }}>
            💧を引っ張って離すと発射！ターゲットに当てて得点ゲット！
          </div>
        )}
        {gameState === 'aiming' && (
          <div style={{ fontSize: '0.95rem', color: '#ffd700' }}>
            引っ張り中... 離すと発射！
          </div>
        )}
        {gameState === 'shooting' && (
          <div style={{ fontSize: '0.95rem', color: '#60a5fa' }}>
            発射！
          </div>
        )}
        {gameState === 'ended' && (
          <div style={{ fontSize: '1.1rem', color: '#48bb78', fontWeight: '600' }}>
            🎉 ゲーム終了！ 最終スコア: {score}点
          </div>
        )}
      </div>

      {/* Close button */}
      {gameState === 'ended' && (
        <button
          onClick={onClose}
          style={{
            marginTop: '16px',
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '1.1rem',
            fontWeight: '600',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          閉じる
        </button>
      )}
    </div>
  )
}
