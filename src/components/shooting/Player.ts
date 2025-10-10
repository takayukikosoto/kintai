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

    // プレイヤー機体を描画（三角形）
    ctx.fillStyle = '#60a5fa'
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.moveTo(this.x + this.width / 2, this.y)
    ctx.lineTo(this.x, this.y + this.height)
    ctx.lineTo(this.x + this.width, this.y + this.height)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.restore()
  }
}
