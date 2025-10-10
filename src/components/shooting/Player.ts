import type { Player } from './types'

export class PlayerShip implements Player {
  x: number
  y: number
  width: number
  height: number
  active: boolean
  hp: number
  maxHp: number
  speed: number
  shootCooldown: number
  lastShotTime: number
  invincible: boolean
  invincibleTime: number

  constructor(canvasWidth: number, canvasHeight: number) {
    this.width = 30
    this.height = 30
    this.x = canvasWidth / 2 - this.width / 2
    this.y = canvasHeight - 100
    this.active = true
    this.hp = 3
    this.maxHp = 3
    this.speed = 5
    this.shootCooldown = 0.15  // 秒
    this.lastShotTime = 0
    this.invincible = false
    this.invincibleTime = 0
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number) {
    // 無敵時間の更新
    if (this.invincible) {
      this.invincibleTime -= deltaTime
      if (this.invincibleTime <= 0) {
        this.invincible = false
        this.invincibleTime = 0
      }
    }
  }

  move(dx: number, dy: number, canvasWidth: number, canvasHeight: number) {
    this.x += dx * this.speed
    this.y += dy * this.speed

    // 画面内に制限
    this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x))
    this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y))
  }

  canShoot(currentTime: number): boolean {
    return currentTime - this.lastShotTime >= this.shootCooldown
  }

  shoot(currentTime: number) {
    this.lastShotTime = currentTime
  }

  takeDamage(damage: number) {
    if (this.invincible) return

    this.hp -= damage
    if (this.hp <= 0) {
      this.hp = 0
      this.active = false
    } else {
      // 被弾後の無敵時間
      this.invincible = true
      this.invincibleTime = 1.5
    }
  }

  heal(amount: number) {
    this.hp = Math.min(this.maxHp, this.hp + amount)
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save()

    // 無敵時の点滅
    if (this.invincible && Math.floor(this.invincibleTime * 10) % 2 === 0) {
      ctx.globalAlpha = 0.5
    }

    const centerX = this.x + this.width / 2
    const centerY = this.y + this.height / 2

    // エンジン炎エフェクト（後ろから出る）
    const flameLength = 15 + Math.random() * 5
    const flameGradient = ctx.createLinearGradient(
      centerX, this.y + this.height,
      centerX, this.y + this.height + flameLength
    )
    flameGradient.addColorStop(0, '#fbbf24')
    flameGradient.addColorStop(0.5, '#f97316')
    flameGradient.addColorStop(1, 'rgba(239, 68, 68, 0)')
    
    ctx.fillStyle = flameGradient
    ctx.beginPath()
    ctx.moveTo(centerX - 4, this.y + this.height)
    ctx.lineTo(centerX, this.y + this.height + flameLength)
    ctx.lineTo(centerX + 4, this.y + this.height)
    ctx.closePath()
    ctx.fill()

    // ウィング（左）
    const wingGradient1 = ctx.createLinearGradient(
      this.x - 8, centerY,
      this.x + 5, centerY
    )
    wingGradient1.addColorStop(0, '#1e40af')
    wingGradient1.addColorStop(1, '#3b82f6')
    
    ctx.fillStyle = wingGradient1
    ctx.beginPath()
    ctx.moveTo(this.x, centerY)
    ctx.lineTo(this.x - 8, centerY + 10)
    ctx.lineTo(this.x, centerY + 15)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#1e3a8a'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // ウィング（右）
    const wingGradient2 = ctx.createLinearGradient(
      this.x + this.width - 5, centerY,
      this.x + this.width + 8, centerY
    )
    wingGradient2.addColorStop(0, '#3b82f6')
    wingGradient2.addColorStop(1, '#1e40af')
    
    ctx.fillStyle = wingGradient2
    ctx.beginPath()
    ctx.moveTo(this.x + this.width, centerY)
    ctx.lineTo(this.x + this.width + 8, centerY + 10)
    ctx.lineTo(this.x + this.width, centerY + 15)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#1e3a8a'
    ctx.stroke()

    // メイン機体（グラデーション）
    const bodyGradient = ctx.createLinearGradient(
      centerX, this.y,
      centerX, this.y + this.height
    )
    bodyGradient.addColorStop(0, '#60a5fa')
    bodyGradient.addColorStop(0.5, '#3b82f6')
    bodyGradient.addColorStop(1, '#2563eb')
    
    ctx.fillStyle = bodyGradient
    ctx.beginPath()
    ctx.moveTo(centerX, this.y)
    ctx.lineTo(this.x + 2, this.y + this.height - 8)
    ctx.lineTo(this.x + 5, this.y + this.height)
    ctx.lineTo(this.x + this.width - 5, this.y + this.height)
    ctx.lineTo(this.x + this.width - 2, this.y + this.height - 8)
    ctx.closePath()
    ctx.fill()
    
    // 機体アウトライン
    ctx.strokeStyle = '#1e3a8a'
    ctx.lineWidth = 2
    ctx.stroke()

    // コックピット（ガラス風）
    const cockpitGradient = ctx.createRadialGradient(
      centerX, this.y + 8,
      0,
      centerX, this.y + 8,
      8
    )
    cockpitGradient.addColorStop(0, 'rgba(147, 197, 253, 0.8)')
    cockpitGradient.addColorStop(0.7, 'rgba(96, 165, 250, 0.6)')
    cockpitGradient.addColorStop(1, 'rgba(59, 130, 246, 0.3)')
    
    ctx.fillStyle = cockpitGradient
    ctx.beginPath()
    ctx.arc(centerX, this.y + 8, 6, 0, Math.PI * 2)
    ctx.fill()
    
    // コックピット光彩
    ctx.strokeStyle = '#dbeafe'
    ctx.lineWidth = 1
    ctx.stroke()

    // 装甲ライン（ディテール）
    ctx.strokeStyle = '#1e40af'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(this.x + 8, this.y + 15)
    ctx.lineTo(this.x + 8, this.y + 25)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(this.x + this.width - 8, this.y + 15)
    ctx.lineTo(this.x + this.width - 8, this.y + 25)
    ctx.stroke()

    ctx.restore()
  }
}
