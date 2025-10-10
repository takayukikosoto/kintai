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
    this.width = typeData.size
    this.height = typeData.size
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
    const isBoss = this.type.includes('boss')

    if (isBoss) {
      // ボス機体
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
    const size = this.width
    
    // 外装グラデーション
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2)
    gradient.addColorStop(0, '#dc2626')
    gradient.addColorStop(0.5, '#991b1b')
    gradient.addColorStop(1, '#7f1d1d')
    
    // メイン機体
    ctx.fillStyle = gradient
    ctx.strokeStyle = '#450a0a'
    ctx.lineWidth = 4
    
    ctx.beginPath()
    ctx.moveTo(centerX, this.y + size * 0.2)
    ctx.lineTo(this.x + size * 0.2, centerY)
    ctx.lineTo(centerX, this.y + size * 0.8)
    ctx.lineTo(this.x + size * 0.8, centerY)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // コア（中心）
    const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size * 0.15)
    coreGradient.addColorStop(0, '#fca5a5')
    coreGradient.addColorStop(0.6, '#ef4444')
    coreGradient.addColorStop(1, '#dc2626')
    
    ctx.fillStyle = coreGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, size * 0.15, 0, Math.PI * 2)
    ctx.fill()
    
    // 装甲パネル
    ctx.strokeStyle = '#7f1d1d'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(centerX, this.y + size * 0.3)
    ctx.lineTo(centerX, this.y + size * 0.7)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(this.x + size * 0.3, centerY)
    ctx.lineTo(this.x + size * 0.7, centerY)
    ctx.stroke()

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
    const size = this.width / 2
    
    // 機体グラデーション
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size)
    gradient.addColorStop(0, '#f87171')
    gradient.addColorStop(0.7, '#ef4444')
    gradient.addColorStop(1, '#dc2626')
    
    ctx.fillStyle = gradient
    ctx.strokeStyle = '#991b1b'
    ctx.lineWidth = 2
    
    // 逆三角形
    ctx.beginPath()
    ctx.moveTo(centerX, centerY + size)
    ctx.lineTo(centerX - size * 0.8, centerY - size * 0.5)
    ctx.lineTo(centerX + size * 0.8, centerY - size * 0.5)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    
    // コア
    ctx.fillStyle = '#fca5a5'
    ctx.beginPath()
    ctx.arc(centerX, centerY, size * 0.3, 0, Math.PI * 2)
    ctx.fill()
  }

  private renderZigzagEnemy(ctx: CanvasRenderingContext2D, centerX: number, centerY: number) {
    const size = this.width / 2
    
    // 本体グラデーション
    const gradient = ctx.createLinearGradient(centerX - size, centerY, centerX + size, centerY)
    gradient.addColorStop(0, '#fb923c')
    gradient.addColorStop(0.5, '#f97316')
    gradient.addColorStop(1, '#ea580c')
    
    // ウィング付き機体
    ctx.fillStyle = gradient
    ctx.strokeStyle = '#9a3412'
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - size * 0.8)
    ctx.lineTo(centerX - size, centerY + size * 0.5)
    ctx.lineTo(centerX, centerY + size * 0.3)
    ctx.lineTo(centerX + size, centerY + size * 0.5)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    
    // ウィング先端
    ctx.fillStyle = '#fed7aa'
    ctx.beginPath()
    ctx.arc(centerX - size, centerY + size * 0.5, size * 0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(centerX + size, centerY + size * 0.5, size * 0.2, 0, Math.PI * 2)
    ctx.fill()
  }

  private renderShooterEnemy(ctx: CanvasRenderingContext2D, centerX: number, centerY: number) {
    const size = this.width / 2
    
    // 重装甲機体
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size)
    gradient.addColorStop(0, '#a78bfa')
    gradient.addColorStop(0.6, '#8b5cf6')
    gradient.addColorStop(1, '#7c3aed')
    
    ctx.fillStyle = gradient
    ctx.strokeStyle = '#5b21b6'
    ctx.lineWidth = 2.5
    
    // 六角形
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2
      const x = centerX + Math.cos(angle) * size
      const y = centerY + Math.sin(angle) * size
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    
    // 砲台
    ctx.fillStyle = '#6d28d9'
    ctx.fillRect(centerX - size * 0.15, centerY + size * 0.3, size * 0.3, size * 0.6)
    
    // コア
    ctx.fillStyle = '#e9d5ff'
    ctx.beginPath()
    ctx.arc(centerX, centerY, size * 0.35, 0, Math.PI * 2)
    ctx.fill()
  }

  private renderFastEnemy(ctx: CanvasRenderingContext2D, centerX: number, centerY: number) {
    const size = this.width / 2
    
    // 高速機グラデーション
    const gradient = ctx.createLinearGradient(centerX, centerY - size, centerX, centerY + size)
    gradient.addColorStop(0, '#67e8f9')
    gradient.addColorStop(0.5, '#06b6d4')
    gradient.addColorStop(1, '#0891b2')
    
    ctx.fillStyle = gradient
    ctx.strokeStyle = '#155e75'
    ctx.lineWidth = 2
    
    // 流線型
    ctx.beginPath()
    ctx.moveTo(centerX, centerY + size)
    ctx.quadraticCurveTo(centerX - size * 0.6, centerY, centerX - size * 0.4, centerY - size)
    ctx.lineTo(centerX + size * 0.4, centerY - size)
    ctx.quadraticCurveTo(centerX + size * 0.6, centerY, centerX, centerY + size)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    
    // スピードライン
    ctx.strokeStyle = '#a5f3fc'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - size * 0.5)
    ctx.lineTo(centerX, centerY + size * 0.5)
    ctx.stroke()
  }
}
