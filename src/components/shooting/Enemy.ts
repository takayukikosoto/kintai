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
    const isBoss = this.type.includes('boss')

    // 敵機体を描画
    ctx.fillStyle = this.color
    ctx.strokeStyle = isBoss ? '#7c2d12' : '#991b1b'
    ctx.lineWidth = isBoss ? 3 : 2

    if (isBoss) {
      // ボスは四角形
      ctx.fillRect(this.x, this.y, this.width, this.height)
      ctx.strokeRect(this.x, this.y, this.width, this.height)

      // HPバー
      const barWidth = this.width
      const barHeight = 6
      const barY = this.y - 10

      // 背景
      ctx.fillStyle = '#4b5563'
      ctx.fillRect(this.x, barY, barWidth, barHeight)

      // HP
      const hpRatio = this.hp / this.maxHp
      ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444'
      ctx.fillRect(this.x, barY, barWidth * hpRatio, barHeight)
    } else {
      // 通常敵は円
      ctx.beginPath()
      ctx.arc(
        this.x + this.width / 2,
        this.y + this.height / 2,
        this.width / 2,
        0,
        Math.PI * 2
      )
      ctx.fill()
      ctx.stroke()
    }
  }
}
