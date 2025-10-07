import { useState, useRef, useEffect, useCallback } from 'react'

// ========== 型定義 ==========
type ProjectileType = 'slime' | 'arrow' | 'boomerang'

interface Vector2 {
  x: number
  y: number
}

interface Target {
  id: number
  x: number
  y: number
  baseY: number
  points: number
  emoji: string
  hit: boolean
  floatPhase: number
  rotation: number
  scale: number
}

enum ParticleType {
  LAUNCH_SPARK,
  LAUNCH_SMOKE,
  TRAIL,
  HIT_EXPLOSION,
  HIT_STAR,
  SCORE_POP,
  CONFETTI
}

interface Particle {
  id: number
  type: ParticleType
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  rotation: number
  rotationSpeed: number
  text?: string
}

interface SlimeShooterV2Props {
  onGameEnd: (score: number) => void
  onClose: () => void
}

// ========== ユーティリティ関数 ==========
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const distance = (x1: number, y1: number, x2: number, y2: number) => 
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOutQuad = (t: number) => 
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

// ========== メインコンポーネント ==========
export default function SlimeShooterV2({ onGameEnd, onClose }: SlimeShooterV2Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<'ready' | 'aiming' | 'shooting' | 'ended'>('ready')
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [attemptsLeft, setAttemptsLeft] = useState(3)
  const [dragStart, setDragStart] = useState<Vector2 | null>(null)
  const [dragCurrent, setDragCurrent] = useState<Vector2 | null>(null)
  const [selectedProjectile, setSelectedProjectile] = useState<ProjectileType>('slime')
  
  // Refs for game state
  const projectileRef = useRef({
    type: 'slime' as ProjectileType,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    wobblePhase: 0,
    wobbleAmplitude: 0,
    active: false,
    trail: [] as Array<{ x: number; y: number; alpha: number; scale: number }>,
    // ブーメラン用
    returnTime: 0,
    maxDistance: 0,
    startX: 0,
    startY: 0
  })
  
  const targetsRef = useRef<Target[]>([])
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>()
  const scoreRef = useRef(0)
  const comboRef = useRef(0)
  const lastHitTime = useRef(0)
  const shakeRef = useRef({ x: 0, y: 0, intensity: 0 })
  
  // Constants
  const CANVAS_WIDTH = 400
  const CANVAS_HEIGHT = 600  // 通常サイズに戻す
  const SLIME_START_X = CANVAS_WIDTH / 2
  const SLIME_START_Y = 500  // 画面下部に配置
  const SLIME_RADIUS = 20
  
  // Physics constants
  const SPRING_CONSTANT = 0.15
  const DAMPING = 0.92
  const GRAVITY = 0.4
  const AIR_RESISTANCE = 0.995
  const MAX_DRAG_DISTANCE = 120
  const WOBBLE_FREQUENCY = 15
  
  useEffect(() => {
    initTargets()
    startGameLoop()
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])
  
  // ========== ターゲット初期化 ==========
  function initTargets() {
    const targets: Target[] = []
    const configs = [
      { emoji: '⭐', points: 50, count: 27 },   // 9 → 27 (3倍)
      { emoji: '💰', points: 100, count: 36 }, // 12 → 36 (3倍)
      { emoji: '💎', points: 200, count: 27 }   // 9 → 27 (3倍)
    ]
    
    let id = 0
    configs.forEach(config => {
      for (let i = 0; i < config.count; i++) {
        const x = 60 + Math.random() * (CANVAS_WIDTH - 120)
        const y = 60 + Math.random() * 350  // 画面上部～中央に配置
        targets.push({
          id: id++,
          x,
          y,
          baseY: y,
          points: config.points,
          emoji: config.emoji,
          hit: false,
          floatPhase: Math.random() * Math.PI * 2,
          rotation: 0,
          scale: 1
        })
      }
    })
    
    targetsRef.current = targets
  }
  
  // ========== パーティクル生成 ==========
  function createParticles(type: ParticleType, x: number, y: number, extra?: any) {
    const particles: Particle[] = []
    let particleId = Date.now()
    
    switch (type) {
      case ParticleType.LAUNCH_SPARK:
        for (let i = 0; i < 30; i++) {
          const angle = Math.random() * Math.PI * 2
          const speed = 5 + Math.random() * 10
          particles.push({
            id: particleId++,
            type,
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            maxLife: 1,
            size: 2 + Math.random() * 2,
            color: ['#60a5fa', '#93c5fd', '#ffffff'][Math.floor(Math.random() * 3)],
            rotation: 0,
            rotationSpeed: 0
          })
        }
        break
        
      case ParticleType.LAUNCH_SMOKE:
        for (let i = 0; i < 5; i++) {
          particles.push({
            id: particleId++,
            type,
            x: x + (Math.random() - 0.5) * 20,
            y,
            vx: (Math.random() - 0.5) * 2,
            vy: -1 - Math.random() * 2,
            life: 1,
            maxLife: 1,
            size: 10 + Math.random() * 10,
            color: 'rgba(255, 255, 255, 0.5)',
            rotation: 0,
            rotationSpeed: 0
          })
        }
        break
        
      case ParticleType.HIT_EXPLOSION:
        const points = extra?.points || 50
        const count = points >= 200 ? 60 : 40
        const color = points >= 200 ? '#ffd700' : '#60a5fa'
        
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2
          const speed = 3 + Math.random() * 9
          particles.push({
            id: particleId++,
            type,
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            maxLife: 1,
            size: 3 + Math.random() * 5,
            color,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2
          })
        }
        break
        
      case ParticleType.SCORE_POP:
        particles.push({
          id: particleId++,
          type,
          x, y,
          vx: 0,
          vy: -2,
          life: 1,
          maxLife: 1,
          size: extra?.points >= 200 ? 32 : 24,
          color: extra?.points >= 200 ? '#ffd700' : '#ffffff',
          rotation: 0,
          rotationSpeed: 0,
          text: `+${extra?.points || 0}`
        })
        break
    }
    
    particlesRef.current.push(...particles)
  }
  
  // ========== ゲームループ ==========
  function startGameLoop() {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    let lastTime = performance.now()
    
    function animate(currentTime: number) {
      if (!ctx || !canvas) return
      
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1)
      lastTime = currentTime
      
      // Clear
      ctx.fillStyle = '#1a202c'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      
      // Update shake
      if (shakeRef.current.intensity > 0) {
        shakeRef.current.intensity *= 0.9
        shakeRef.current.x = (Math.random() - 0.5) * shakeRef.current.intensity
        shakeRef.current.y = (Math.random() - 0.5) * shakeRef.current.intensity
      }
      
      ctx.save()
      ctx.translate(shakeRef.current.x, shakeRef.current.y)
      
      // Update and draw targets
      updateAndDrawTargets(ctx, currentTime, deltaTime)
      
      // Update and draw slime
      updateAndDrawSlime(ctx, deltaTime)
      
      // Update and draw particles
      updateAndDrawParticles(ctx, deltaTime)
      
      // Draw UI overlays
      drawSpringLine(ctx)
      drawPowerMeter(ctx)
      
      ctx.restore()
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animate(performance.now())
  }
  
  // ========== ターゲット更新・描画 ==========
  function updateAndDrawTargets(ctx: CanvasRenderingContext2D, time: number, deltaTime: number) {
    targetsRef.current.forEach(target => {
      if (target.hit) return
      
      // Floating animation
      target.floatPhase += deltaTime * 2
      target.y = target.baseY + Math.sin(target.floatPhase) * 15
      target.rotation += deltaTime * 0.5
      
      // Draw glow for high-value targets (サイズ調整)
      if (target.points >= 200) {
        const pulse = 0.7 + Math.sin(time * 0.003) * 0.3
        ctx.save()
        ctx.globalAlpha = pulse * 0.3
        ctx.fillStyle = '#ffd700'
        ctx.beginPath()
        ctx.arc(target.x, target.y, 18, 0, Math.PI * 2)  // 35 → 18
        ctx.fill()
        ctx.restore()
      }
      
      // Draw target (サイズ半分)
      ctx.save()
      ctx.translate(target.x, target.y)
      ctx.rotate(target.rotation)
      ctx.scale(target.scale, target.scale)
      ctx.font = '16px Arial'  // 32px → 16px
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(target.emoji, 0, 0)
      ctx.restore()
      
      // Draw points
      ctx.font = '8px Arial'  // 12px → 8px
      ctx.fillStyle = '#ffd700'
      ctx.textAlign = 'center'
      ctx.fillText(`${target.points}`, target.x, target.y + 12)
    })
  }
  
  // ========== プロジェクタイル更新・描画 ==========
  function updateAndDrawSlime(ctx: CanvasRenderingContext2D, deltaTime: number) {
    const slime = projectileRef.current
    
    // Wobble update (always)
    if (slime.wobbleAmplitude > 0.01) {
      slime.wobblePhase += WOBBLE_FREQUENCY * deltaTime
      slime.wobbleAmplitude *= 0.92
    }
    
    if (slime.active) {
      // プロジェクタイルタイプ別の物理演算
      if (slime.type === 'arrow') {
        // 矢：重力の影響少なめ、空気抵抗少なめ（貫通感）
        slime.vy += GRAVITY * 0.3 * deltaTime * 60
        slime.vx *= 0.998
        slime.vy *= 0.998
      } else if (slime.type === 'boomerang') {
        // ブーメラン：戻ってくる動き
        slime.returnTime += deltaTime
        const currentDist = distance(slime.x, slime.y, slime.startX, slime.startY)
        slime.maxDistance = Math.max(slime.maxDistance, currentDist)
        
        // 一定距離または時間で戻り始める
        if (slime.returnTime > 1.5 || currentDist > 400) {
          const returnAngle = Math.atan2(slime.startY - slime.y, slime.startX - slime.x)
          const returnForce = 0.5
          slime.vx += Math.cos(returnAngle) * returnForce
          slime.vy += Math.sin(returnAngle) * returnForce
        }
        
        slime.vy += GRAVITY * 0.2 * deltaTime * 60
        slime.vx *= 0.99
        slime.vy *= 0.99
      } else {
        // スライム：通常の物理
        slime.vy += GRAVITY * deltaTime * 60
        slime.vx *= AIR_RESISTANCE
        slime.vy *= AIR_RESISTANCE
      }
      
      slime.x += slime.vx * deltaTime * 60
      slime.y += slime.vy * deltaTime * 60
      
      // Rotation
      const speed = Math.sqrt(slime.vx ** 2 + slime.vy ** 2)
      if (slime.type === 'arrow') {
        // 矢：速度方向を向く
        slime.rotation = Math.atan2(slime.vy, slime.vx)
      } else if (slime.type === 'boomerang') {
        // ブーメラン：高速回転
        slime.rotation += deltaTime * 60 * 0.3
      } else {
        // スライム：通常回転
        slime.rotation += (speed / 10) * deltaTime * 60 * 0.1
      }
      
      // Squash and stretch (スライムのみ)
      if (slime.type === 'slime') {
        const stretchFactor = Math.min(speed / 15, 1.5)
        slime.scaleX = 1 + stretchFactor * 0.3
        slime.scaleY = 1 - stretchFactor * 0.2
        
        // Wobble
        if (slime.wobbleAmplitude > 0.01) {
          slime.wobblePhase += WOBBLE_FREQUENCY * deltaTime
          slime.wobbleAmplitude *= 0.92
          
          const wobble = Math.sin(slime.wobblePhase) * slime.wobbleAmplitude
          slime.scaleX += wobble
          slime.scaleY -= wobble
        }
      } else {
        slime.scaleX = 1
        slime.scaleY = 1
      }
      
      // Trail
      if (slime.trail.length === 0 || distance(slime.x, slime.y, slime.trail[0].x, slime.trail[0].y) > 10) {
        slime.trail.unshift({ x: slime.x, y: slime.y, alpha: 0.6, scale: 1 })
        if (slime.trail.length > 15) slime.trail.pop()
      }
      
      slime.trail.forEach(t => {
        t.alpha *= 0.95
        t.scale *= 0.98
      })
      slime.trail = slime.trail.filter(t => t.alpha > 0.01)
      
      // Collision detection (サイズ半分なので判定も小さく)
      targetsRef.current.forEach(target => {
        if (!target.hit && distance(slime.x, slime.y, target.x, target.y) < SLIME_RADIUS + 10) {
          target.hit = true
          target.scale = 1.5
          
          // Update score and combo
          const now = Date.now()
          if (now - lastHitTime.current < 1000) {
            comboRef.current += 1
          } else {
            comboRef.current = 1
          }
          lastHitTime.current = now
          
          const multiplier = 1 + (comboRef.current - 1) * 0.2
          const earnedPoints = Math.floor(target.points * multiplier)
          scoreRef.current += earnedPoints
          setScore(scoreRef.current)
          setCombo(comboRef.current)
          
          // Effects
          createParticles(ParticleType.HIT_EXPLOSION, target.x, target.y, { points: target.points })
          createParticles(ParticleType.SCORE_POP, target.x, target.y - 30, { points: earnedPoints })
          
          slime.wobbleAmplitude = 0.3
          shakeRef.current.intensity = target.points >= 200 ? 8 : 4
        }
      })
      
      // Out of bounds check
      if (slime.y < -50 || slime.x < -50 || slime.x > CANVAS_WIDTH + 50 || slime.y > CANVAS_HEIGHT + 50) {
        slime.active = false
        slime.x = SLIME_START_X
        slime.y = SLIME_START_Y
        slime.vx = 0
        slime.vy = 0
        slime.scaleX = 1
        slime.scaleY = 1
        slime.rotation = 0
        slime.trail = []
        setGameState('ready')
        
        // Reset combo if missed
        setTimeout(() => {
          comboRef.current = 0
          setCombo(0)
        }, 1000)
      }
    } else {
      // Not active - ensure at start position
      slime.x = SLIME_START_X
      slime.y = SLIME_START_Y
      slime.vx = 0
      slime.vy = 0
      slime.scaleX = 1
      slime.scaleY = 1
      slime.rotation = 0
    }
    
    // Draw trail
    slime.trail.forEach((t: any) => {
      ctx.globalAlpha = t.alpha
      drawProjectile(ctx, slime.type, t.x, t.y, SLIME_RADIUS * t.scale, 1, 1, 0)
    })
    ctx.globalAlpha = 1
    
    // Draw slime
    let displayX = slime.active ? slime.x : SLIME_START_X
    let displayY = slime.active ? slime.y : SLIME_START_Y
    let displayScaleX = slime.active ? slime.scaleX : 1
    let displayScaleY = slime.active ? slime.scaleY : 1
    let displayRotation = slime.active ? slime.rotation : 0
    
    // 引っ張り中の変形と移動
    if (gameState === 'aiming' && dragCurrent) {
      const dx = dragCurrent.x - SLIME_START_X
      const dy = dragCurrent.y - SLIME_START_Y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const stretchAmount = Math.min(dist / MAX_DRAG_DISTANCE, 1)
      
      // 引っ張り方向に伸びる
      const angle = Math.atan2(dy, dx)
      displayRotation = angle
      displayScaleX = 1 + stretchAmount * 0.8  // 引っ張り方向に伸びる
      displayScaleY = 1 - stretchAmount * 0.4  // 垂直方向は縮む
      
      // スライムが引っ張り方向に少し移動（バネ効果）
      displayX = SLIME_START_X + dx * 0.3
      displayY = SLIME_START_Y + dy * 0.3
    }
    
    // Wobbleを適用
    if (slime.wobbleAmplitude > 0.01) {
      const wobble = Math.sin(slime.wobblePhase) * slime.wobbleAmplitude
      displayScaleX += wobble
      displayScaleY -= wobble
    }
    
    const projectileType = slime.active ? slime.type : selectedProjectile
    drawProjectile(ctx, projectileType, displayX, displayY, SLIME_RADIUS, displayScaleX, displayScaleY, displayRotation)
  }
  
  // ========== プロジェクタイル描画 ==========
  function drawProjectile(
    ctx: CanvasRenderingContext2D,
    type: ProjectileType,
    x: number,
    y: number,
    radius: number,
    scaleX: number,
    scaleY: number,
    rotation: number
  ) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)
    
    if (type === 'slime') {
      // スライム
      const gradient = ctx.createRadialGradient(
        -radius * 0.3, -radius * 0.3, 0,
        0, 0, radius
      )
      gradient.addColorStop(0, '#93c5fd')
      gradient.addColorStop(0.6, '#60a5fa')
      gradient.addColorStop(1, '#3b82f6')
      
      ctx.beginPath()
      ctx.ellipse(0, 0, radius * scaleX, radius * scaleY, 0, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
      
      // Highlight
      ctx.globalAlpha = 0.6
      ctx.beginPath()
      ctx.ellipse(-radius * 0.25, -radius * 0.25, radius * 0.4, radius * 0.3, -0.3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.fill()
      ctx.globalAlpha = 1
    } else if (type === 'arrow') {
      // 矢
      ctx.fillStyle = '#fbbf24'
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 2
      
      // 矢じり
      ctx.beginPath()
      ctx.moveTo(radius * 1.5, 0)
      ctx.lineTo(-radius * 0.5, -radius * 0.8)
      ctx.lineTo(-radius * 0.5, radius * 0.8)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      
      // 矢の柄
      ctx.fillStyle = '#92400e'
      ctx.fillRect(-radius * 1.5, -radius * 0.2, radius, radius * 0.4)
      
      // 羽
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.moveTo(-radius * 1.5, 0)
      ctx.lineTo(-radius * 2, -radius * 0.5)
      ctx.lineTo(-radius * 1.5, -radius * 0.3)
      ctx.closePath()
      ctx.fill()
      
      ctx.beginPath()
      ctx.moveTo(-radius * 1.5, 0)
      ctx.lineTo(-radius * 2, radius * 0.5)
      ctx.lineTo(-radius * 1.5, radius * 0.3)
      ctx.closePath()
      ctx.fill()
    } else if (type === 'boomerang') {
      // ブーメラン（円月輪）
      const gradient = ctx.createLinearGradient(-radius, 0, radius, 0)
      gradient.addColorStop(0, '#8b5cf6')
      gradient.addColorStop(0.5, '#a78bfa')
      gradient.addColorStop(1, '#8b5cf6')
      
      // 外側の円
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2)
      ctx.fill()
      
      // 内側の穴
      ctx.fillStyle = '#1a202c'
      ctx.beginPath()
      ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2)
      ctx.fill()
      
      // 刃のエフェクト
      ctx.strokeStyle = '#c4b5fd'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2)
      ctx.stroke()
    }
    
    ctx.restore()
  }
  
  // ========== パーティクル更新・描画 ==========
  function updateAndDrawParticles(ctx: CanvasRenderingContext2D, deltaTime: number) {
    particlesRef.current = particlesRef.current.filter(p => {
      p.life -= deltaTime
      if (p.life <= 0) return false
      
      // Update position
      if (p.type !== ParticleType.SCORE_POP) {
        p.vy += 0.2 * deltaTime * 60
      }
      p.x += p.vx * deltaTime * 60
      p.y += p.vy * deltaTime * 60
      p.rotation += p.rotationSpeed
      
      // Draw
      const alpha = p.life / p.maxLife
      ctx.globalAlpha = alpha
      
      if (p.text) {
        ctx.font = `bold ${p.size}px Arial`
        ctx.fillStyle = p.color
        ctx.textAlign = 'center'
        ctx.fillText(p.text, p.x, p.y)
      } else {
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      
      ctx.globalAlpha = 1
      return true
    })
  }
  
  // ========== バネライン描画 ==========
  function drawSpringLine(ctx: CanvasRenderingContext2D) {
    if (gameState !== 'aiming' || !dragCurrent) return
    
    const dist = distance(SLIME_START_X, SLIME_START_Y, dragCurrent.x, dragCurrent.y)
    const power = Math.min(dist / MAX_DRAG_DISTANCE, 1)
    
    // Color based on power
    let color = '#60a5fa'
    if (power > 0.7) color = '#ef4444'
    else if (power > 0.3) color = '#fbbf24'
    
    // Line thickness
    const thickness = 2 + power * 6
    
    ctx.strokeStyle = color
    ctx.lineWidth = thickness
    ctx.setLineDash([10, 5])
    ctx.beginPath()
    ctx.moveTo(SLIME_START_X, SLIME_START_Y)
    ctx.lineTo(dragCurrent.x, dragCurrent.y)
    ctx.stroke()
    ctx.setLineDash([])
  }
  
  // ========== パワーメーター描画 ==========
  function drawPowerMeter(ctx: CanvasRenderingContext2D) {
    if (gameState !== 'aiming' || !dragCurrent) return
    
    const dist = distance(SLIME_START_X, SLIME_START_Y, dragCurrent.x, dragCurrent.y)
    const power = Math.min(dist / MAX_DRAG_DISTANCE, 1)
    
    // Circle gauge around slime
    ctx.save()
    ctx.translate(SLIME_START_X, SLIME_START_Y)
    
    // Background circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(0, 0, 35, 0, Math.PI * 2)
    ctx.stroke()
    
    // Power arc
    let color = '#60a5fa'
    if (power > 0.7) color = '#ef4444'
    else if (power > 0.3) color = '#fbbf24'
    
    ctx.strokeStyle = color
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(0, 0, 35, -Math.PI / 2, -Math.PI / 2 + power * Math.PI * 2)
    ctx.stroke()
    
    // Power text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`${Math.floor(power * 100)}%`, 0, 5)
    
    ctx.restore()
  }
  
  // ========== 入力処理 ==========
  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (gameState !== 'ready' || attemptsLeft <= 0) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    
    setDragStart({ x, y })
    setDragCurrent({ x, y })
    setGameState('aiming')
    
    // タッチ時にブルッと震える
    projectileRef.current.wobbleAmplitude = 0.25
    projectileRef.current.wobblePhase = 0
  }, [gameState, attemptsLeft])
  
  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (gameState !== 'aiming' || !dragStart) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    
    setDragCurrent({ x, y })
  }, [gameState, dragStart])
  
  const handleEnd = useCallback(() => {
    if (gameState !== 'aiming' || !dragCurrent) return
    
    const dx = dragCurrent.x - SLIME_START_X
    const dy = dragCurrent.y - SLIME_START_Y
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist < 20) {
      setGameState('ready')
      setDragStart(null)
      setDragCurrent(null)
      return
    }
    
    // 選択されたプロジェクタイルに応じて速度を調整
    let powerMultiplier = 1
    if (selectedProjectile === 'arrow') {
      powerMultiplier = 1.8  // 矢は速い
    } else if (selectedProjectile === 'boomerang') {
      powerMultiplier = 1.3  // ブーメランは中間
    }
    
    const power = Math.min(dist / MAX_DRAG_DISTANCE, 1) * 20 * powerMultiplier
    const angle = Math.atan2(-dy, -dx)
    
    projectileRef.current.type = selectedProjectile
    projectileRef.current.x = SLIME_START_X
    projectileRef.current.y = SLIME_START_Y
    projectileRef.current.vx = Math.cos(angle) * power
    projectileRef.current.vy = Math.sin(angle) * power
    projectileRef.current.active = true
    projectileRef.current.wobbleAmplitude = 0.3
    projectileRef.current.trail = []
    projectileRef.current.startX = SLIME_START_X
    projectileRef.current.startY = SLIME_START_Y
    projectileRef.current.returnTime = 0
    projectileRef.current.maxDistance = 0
    
    // Launch effects
    createParticles(ParticleType.LAUNCH_SPARK, SLIME_START_X, SLIME_START_Y)
    createParticles(ParticleType.LAUNCH_SMOKE, SLIME_START_X, SLIME_START_Y)
    shakeRef.current.intensity = power * 0.5
    
    setGameState('shooting')
    setAttemptsLeft(prev => prev - 1)
    setDragStart(null)
    setDragCurrent(null)
    
    // Check game end
    setTimeout(() => {
      if (attemptsLeft - 1 <= 0) {
        setGameState('ended')
        setTimeout(() => onGameEnd(scoreRef.current), 1000)
      } else {
        setGameState('ready')
      }
    }, 3000)
  }, [gameState, dragCurrent, attemptsLeft, onGameEnd])
  
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
        padding: '16px 24px',
        borderRadius: '12px 12px 0 0',
        width: CANVAS_WIDTH,
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>💧 スライムシューター</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>残り: {attemptsLeft}回</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>スコア</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{score}</div>
          {combo > 1 && (
            <div style={{ fontSize: '0.85rem', color: '#ffd700', fontWeight: '600' }}>
              {combo} COMBO! ×{(1 + (combo - 1) * 0.2).toFixed(1)}
            </div>
          )}
        </div>
      </div>

      {/* プロジェクタイル選択 */}
      {gameState !== 'ended' && (
        <div style={{
          background: '#2d3748',
          padding: '12px',
          width: CANVAS_WIDTH,
          display: 'flex',
          gap: '8px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setSelectedProjectile('slime')}
            disabled={gameState !== 'ready'}
            style={{
              padding: '8px 16px',
              background: selectedProjectile === 'slime' 
                ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
                : '#4a5568',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: gameState === 'ready' ? 'pointer' : 'not-allowed',
              opacity: gameState === 'ready' ? 1 : 0.5
            }}
          >
            💧 スライム
          </button>
          <button
            onClick={() => setSelectedProjectile('arrow')}
            disabled={gameState !== 'ready'}
            style={{
              padding: '8px 16px',
              background: selectedProjectile === 'arrow' 
                ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                : '#4a5568',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: gameState === 'ready' ? 'pointer' : 'not-allowed',
              opacity: gameState === 'ready' ? 1 : 0.5
            }}
          >
            🏹 矢
          </button>
          <button
            onClick={() => setSelectedProjectile('boomerang')}
            disabled={gameState !== 'ready'}
            style={{
              padding: '8px 16px',
              background: selectedProjectile === 'boomerang' 
                ? 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)'
                : '#4a5568',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: gameState === 'ready' ? 'pointer' : 'not-allowed',
              opacity: gameState === 'ready' ? 1 : 0.5
            }}
          >
            ⭕ 円月輪
          </button>
        </div>
      )}

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
        padding: '20px',
        borderRadius: '0 0 12px 12px',
        width: CANVAS_WIDTH,
        color: 'white',
        textAlign: 'center'
      }}>
        {gameState === 'ready' && (
          <div style={{ fontSize: '1rem' }}>
            💧を引っ張って離すと発射！連続ヒットでコンボボーナス！
          </div>
        )}
        {gameState === 'aiming' && (
          <div style={{ fontSize: '1rem', color: '#ffd700', fontWeight: '600' }}>
            狙いを定めて... 離すと発射！
          </div>
        )}
        {gameState === 'shooting' && (
          <div style={{ fontSize: '1rem', color: '#60a5fa' }}>
            発射！
          </div>
        )}
        {gameState === 'ended' && (
          <div style={{ fontSize: '1.2rem', color: '#48bb78', fontWeight: '700' }}>
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
            padding: '14px 40px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontSize: '1.2rem',
            fontWeight: '700',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
          }}
        >
          閉じる
        </button>
      )}
    </div>
  )
}
