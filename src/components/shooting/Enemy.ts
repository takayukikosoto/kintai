import type { Enemy, EnemyType } from './types'

export class EnemyShip implements Enemy {
  x: number
  y: number
  width: number
  height: number
  active: boolean
  type: string
  hp: number
  maxHp: number
  speed: number
  movementPattern: string
  attackPattern: string | null
  shootInterval: number
  lastShotTime: number
  dropRate: number
  score: number
  color: string
  moveTime: number
  zigzagDirection: number

  constructor(type: string, typeData: EnemyType, x: number, y: number) {
    this.type = type
    this.x = x
    this.y = y
    // 当たり判定を1.8倍に拡大
    this.width = typeData.size * 1.8
    this.height = typeData.size * 1.8
    this.active = true
    this.hp = typeData.hp
    this.maxHp = typeData.hp
    this.speed = typeData.speed
    this.movementPattern = typeData.movementPattern
    this.attackPattern = typeData.attackPattern
    this.shootInterval = typeData.shootInterval
    this.lastShotTime = 0
    this.dropRate = typeData.dropRate
    this.score = typeData.score
    this.color = typeData.color
    this.moveTime = 0
    this.zigzagDirection = 1
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number) {
    this.moveTime += deltaTime

    // 移動パターン
    switch (this.movementPattern) {
      case 'straight':
        this.y += this.speed
        break
      
      case 'zigzag':
        this.y += this.speed
        this.x += Math.sin(this.moveTime * 3) * 2
        break
      
      case 'slow':
        this.y += this.speed * 0.5
        break
      
      case 'bossPatternA':
        // ボスは画面上部で左右に移動
        this.y = Math.min(100, this.y + this.speed)
        this.x += Math.sin(this.moveTime * 1.5) * 3
        this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x))
        break
    }

    // 画面外に出たら非アクティブ
    if (
      this.y > canvasHeight + this.height ||
      this.x < -this.width ||
      this.x > canvasWidth
    ) {
      this.active = false
    }
  }

  takeDamage(damage: number): boolean {
    this.hp -= damage
    if (this.hp <= 0) {
      this.hp = 0
      this.active = false
      return true  // 撃破
    }
    return false
  }

  canShoot(currentTime: number): boolean {
    if (!this.attackPattern) return false
    return currentTime - this.lastShotTime >= this.shootInterval
  }

  shoot(currentTime: number) {
    this.lastShotTime = currentTime
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save()
    
    const centerX = this.x + this.width / 2
    const centerY = this.y + this.height / 2

    if (this.type === 'finalboss') {
      this.renderFinalBoss(ctx, centerX, centerY)
    } else if (this.type === 'boss1') {
      this.renderBoss(ctx, centerX, centerY)
    } else if (this.type === 'small') {
      this.renderSmallEnemy(ctx, centerX, centerY)
    } else if (this.type === 'zigzag') {
      this.renderZigzagEnemy(ctx, centerX, centerY)
    } else if (this.type === 'shooter') {
      this.renderShooterEnemy(ctx, centerX, centerY)
    } else if (this.type === 'fast') {
      this.renderFastEnemy(ctx, centerX, centerY)
    }

    ctx.restore()
  }

  private renderBoss(ctx: CanvasRenderingContext2D, centerX: number, centerY: number) {
    const size = this.width / 1.8
    
    // ボスゾンビキング
    const bodyGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 0.6)
    bodyGradient.addColorStop(0, '#fca5a5')
    bodyGradient.addColorStop(0.5, '#ef4444')
    bodyGradient.addColorStop(1, '#dc2626')
    
    // 体（巨大）
    ctx.fillStyle = bodyGradient
    ctx.strokeStyle = '#450a0a'
    ctx.lineWidth = 4
    
    ctx.beginPath()
    ctx.ellipse(centerX, centerY + size * 0.15, size * 0.6, size * 0.7, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 頭
    const headGradient = ctx.createRadialGradient(centerX, centerY - size * 0.4, 0, centerX, centerY - size * 0.4, size * 0.4)
    headGradient.addColorStop(0, '#fee2e2')
    headGradient.addColorStop(0.8, '#fca5a5')
    headGradient.addColorStop(1, '#f87171')
    
    ctx.fillStyle = headGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY - size * 0.4, size * 0.45, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    // 王冠
    ctx.fillStyle = '#fbbf24'
    ctx.strokeStyle = '#92400e'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(centerX - size * 0.4, centerY - size * 0.75)
    ctx.lineTo(centerX - size * 0.3, centerY - size * 0.9)
    ctx.lineTo(centerX - size * 0.15, centerY - size * 0.75)
    ctx.lineTo(centerX, centerY - size * 0.95)
    ctx.lineTo(centerX + size * 0.15, centerY - size * 0.75)
    ctx.lineTo(centerX + size * 0.3, centerY - size * 0.9)
    ctx.lineTo(centerX + size * 0.4, centerY - size * 0.75)
    ctx.lineTo(centerX + size * 0.4, centerY - size * 0.65)
    ctx.lineTo(centerX - size * 0.4, centerY - size * 0.65)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    
    // 絵文字オーバーレイ
    ctx.font = `${size * 1.3}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('👑', centerX, centerY - size * 0.8)
    ctx.fillText('🧟‍♂️', centerX, centerY + size * 0.1)

    // HPバー
    const barWidth = this.width
    const barHeight = 8
    const barY = this.y - 15

    ctx.fillStyle = '#1f2937'
    ctx.fillRect(this.x, barY, barWidth, barHeight)
    
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 2
    ctx.strokeRect(this.x, barY, barWidth, barHeight)

    const hpRatio = this.hp / this.maxHp
    const hpGradient = ctx.createLinearGradient(this.x, barY, this.x + barWidth * hpRatio, barY)
    if (hpRatio > 0.5) {
      hpGradient.addColorStop(0, '#22c55e')
      hpGradient.addColorStop(1, '#16a34a')
    } else if (hpRatio > 0.25) {
      hpGradient.addColorStop(0, '#eab308')
      hpGradient.addColorStop(1, '#ca8a04')
    } else {
      hpGradient.addColorStop(0, '#ef4444')
      hpGradient.addColorStop(1, '#dc2626')
    }
    
    ctx.fillStyle = hpGradient
    ctx.fillRect(this.x, barY, barWidth * hpRatio, barHeight)
  }

  private renderSmallEnemy(ctx: CanvasRenderingContext2D, centerX: number, centerY: number) {
    const size = this.width / 3.6
    
    // ゾンビの体
    const bodyGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 1.2)
    bodyGradient.addColorStop(0, '#86efac')
    bodyGradient.addColorStop(0.7, '#4ade80')
    bodyGradient.addColorStop(1, '#22c55e')
    
    ctx.fillStyle = bodyGradient
    ctx.strokeStyle = '#166534'
    ctx.lineWidth = 2
    
    // 体（楕円）
    ctx.beginPath()
    ctx.ellipse(centerX, centerY + size * 0.3, size * 0.8, size * 1.0, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    // 頭
    const headGradient = ctx.createRadialGradient(centerX, centerY - size * 0.5, 0, centerX, centerY - size * 0.5, size * 0.7)
    headGradient.addColorStop(0, '#a7f3d0')
    headGradient.addColorStop(0.8, '#6ee7b7')
    headGradient.addColorStop(1, '#34d399')
    
    ctx.fillStyle = headGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY - size * 0.5, size * 0.7, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    // 絵文字オーバーレイ
    ctx.font = `${size * 2.5}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🧟', centerX, centerY)
  }

  private renderZigzagEnemy(ctx: CanvasRenderingContext2D, centerX: number, centerY: number) {
    const size = this.width / 3.6
    
    // 吸血鬼ゾンビ
    const bodyGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 1.2)
    bodyGradient.addColorStop(0, '#fca5a5')
    bodyGradient.addColorStop(0.7, '#f87171')
    bodyGradient.addColorStop(1, '#ef4444')
    
    ctx.fillStyle = bodyGradient
    ctx.strokeStyle = '#7f1d1d'
    ctx.lineWidth = 2
    
    // 体
    ctx.beginPath()
    ctx.ellipse(centerX, centerY + size * 0.3, size * 0.9, size * 1.1, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    // 頭
    ctx.fillStyle = '#fee2e2'
    ctx.beginPath()
    ctx.arc(centerX, centerY - size * 0.5, size * 0.75, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    // 絵文字オーバーレイ
    ctx.font = `${size * 2.5}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🧛', centerX, centerY)
  }

  private renderShooterEnemy(ctx: CanvasRenderingContext2D, centerX: number, centerY: number) {
    const size = this.width / 3.6
    
    // フランケンシュタインゾンビ
    const bodyGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 1.2)
    bodyGradient.addColorStop(0, '#d8b4fe')
    bodyGradient.addColorStop(0.7, '#c084fc')
    bodyGradient.addColorStop(1, '#a855f7')
    
    ctx.fillStyle = bodyGradient
    ctx.strokeStyle = '#581c87'
    ctx.lineWidth = 2.5
    
    // 体（大きめ）
    ctx.beginPath()
    ctx.ellipse(centerX, centerY + size * 0.3, size * 1.0, size * 1.2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    // 頭（四角っぽく）
    ctx.fillStyle = '#e9d5ff'
    ctx.fillRect(centerX - size * 0.7, centerY - size * 1.2, size * 1.4, size * 0.9)
    ctx.strokeRect(centerX - size * 0.7, centerY - size * 1.2, size * 1.4, size * 0.9)
    
    // 絵文字オーバーレイ
    ctx.font = `${size * 2.5}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('👾', centerX, centerY)
  }

  private renderFastEnemy(ctx: CanvasRenderingContext2D, centerX: number, centerY: number) {
    const size = this.width / 3.6
    
    // ゴーストゾンビ
    const bodyGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 1.2)
    bodyGradient.addColorStop(0, '#bae6fd')
    bodyGradient.addColorStop(0.7, '#7dd3fc')
    bodyGradient.addColorStop(1, '#38bdf8')
    
    ctx.fillStyle = bodyGradient
    ctx.strokeStyle = '#0369a1'
    ctx.lineWidth = 2
    
    // 体（波打つ形）
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - size)
    for (let i = 0; i <= 10; i++) {
      const angle = (Math.PI / 10) * i
      const wave = Math.sin(angle * 3) * size * 0.2
      const x = centerX + Math.sin(angle) * (size * 0.8 + wave)
      const y = centerY - Math.cos(angle) * size + size
      ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    
    // 絵文字オーバーレイ
    ctx.font = `${size * 2.5}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('👻', centerX, centerY)
  }

  private renderFinalBoss(ctx: CanvasRenderingContext2D, centerX: number, centerY: number) {
    const size = this.width / 1.5
    const time = Date.now() / 200
    
    // 邪悪なオーラ（パルス）
    const pulseSize = size * (1.0 + Math.sin(time) * 0.15)
    const auraGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize)
    auraGradient.addColorStop(0, 'rgba(127, 29, 29, 0.8)')
    auraGradient.addColorStop(0.5, 'rgba(127, 29, 29, 0.4)')
    auraGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    
    ctx.fillStyle = auraGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2)
    ctx.fill()
    
    // 巨大な体（不気味なグラデーション）
    const bodyGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 0.8)
    bodyGradient.addColorStop(0, '#450a0a')
    bodyGradient.addColorStop(0.5, '#7f1d1d')
    bodyGradient.addColorStop(1, '#450a0a')
    
    ctx.fillStyle = bodyGradient
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 5
    
    ctx.beginPath()
    ctx.ellipse(centerX, centerY + size * 0.2, size * 0.9, size * 1.0, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 頭部（巨大で不気味）
    const headGradient = ctx.createRadialGradient(centerX, centerY - size * 0.5, 0, centerX, centerY - size * 0.5, size * 0.6)
    headGradient.addColorStop(0, '#1a1a1a')
    headGradient.addColorStop(0.7, '#450a0a')
    headGradient.addColorStop(1, '#7f1d1d')
    
    ctx.fillStyle = headGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY - size * 0.5, size * 0.65, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    // 悪魔の角
    ctx.fillStyle = '#1a1a1a'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 3
    
    // 左の角
    ctx.beginPath()
    ctx.moveTo(centerX - size * 0.5, centerY - size * 0.9)
    ctx.quadraticCurveTo(centerX - size * 0.6, centerY - size * 1.3, centerX - size * 0.4, centerY - size * 1.2)
    ctx.lineTo(centerX - size * 0.45, centerY - size * 0.95)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    
    // 右の角
    ctx.beginPath()
    ctx.moveTo(centerX + size * 0.5, centerY - size * 0.9)
    ctx.quadraticCurveTo(centerX + size * 0.6, centerY - size * 1.3, centerX + size * 0.4, centerY - size * 1.2)
    ctx.lineTo(centerX + size * 0.45, centerY - size * 0.95)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    
    // 赤く光る目
    ctx.fillStyle = '#ff0000'
    ctx.shadowColor = '#ff0000'
    ctx.shadowBlur = 20
    
    ctx.beginPath()
    ctx.arc(centerX - size * 0.25, centerY - size * 0.6, size * 0.12, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.beginPath()
    ctx.arc(centerX + size * 0.25, centerY - size * 0.6, size * 0.12, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.shadowBlur = 0
    
    // 王冠（邪悪な王の証）
    ctx.fillStyle = '#fbbf24'
    ctx.strokeStyle = '#92400e'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(centerX - size * 0.55, centerY - size * 1.0)
    ctx.lineTo(centerX - size * 0.4, centerY - size * 1.2)
    ctx.lineTo(centerX - size * 0.25, centerY - size * 1.0)
    ctx.lineTo(centerX, centerY - size * 1.3)
    ctx.lineTo(centerX + size * 0.25, centerY - size * 1.0)
    ctx.lineTo(centerX + size * 0.4, centerY - size * 1.2)
    ctx.lineTo(centerX + size * 0.55, centerY - size * 1.0)
    ctx.lineTo(centerX + size * 0.55, centerY - size * 0.85)
    ctx.lineTo(centerX - size * 0.55, centerY - size * 0.85)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    
    // 絵文字オーバーレイ（超怖い）
    ctx.font = `${size * 1.5}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('👑', centerX, centerY - size * 1.05)
    ctx.fillText('💀', centerX, centerY - size * 0.4)
    ctx.fillText('🔥', centerX - size * 0.8, centerY + size * 0.3)
    ctx.fillText('🔥', centerX + size * 0.8, centerY + size * 0.3)

    // HPバー
    const barWidth = this.width
    const barHeight = 10
    const barY = this.y - 20

    ctx.fillStyle = '#1f2937'
    ctx.fillRect(this.x, barY, barWidth, barHeight)
    
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 2
    ctx.strokeRect(this.x, barY, barWidth, barHeight)

    const hpPercent = this.hp / this.maxHp
    const hpGradient = ctx.createLinearGradient(this.x, barY, this.x + barWidth * hpPercent, barY)
    hpGradient.addColorStop(0, '#ef4444')
    hpGradient.addColorStop(1, '#dc2626')

    ctx.fillStyle = hpGradient
    ctx.fillRect(this.x, barY, barWidth * hpPercent, barHeight)
  }
}
