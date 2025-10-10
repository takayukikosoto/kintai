import type { Bullet } from './types'

export class BulletObject implements Bullet {
  x: number
  y: number
  width: number
  height: number
  active: boolean
  vx: number
  vy: number
  damage: number
  color: string
  isPlayerBullet: boolean

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    color: string,
    size: number,
    isPlayerBullet: boolean
  ) {
    this.x = x
    this.y = y
    this.width = size
    this.height = size
    this.vx = vx
    this.vy = vy
    this.damage = damage
    this.color = color
    this.isPlayerBullet = isPlayerBullet
    this.active = true
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number) {
    this.x += this.vx * deltaTime * 60
    this.y += this.vy * deltaTime * 60

    // 画面外に出たら非アクティブ
    if (
      this.x < -this.width ||
      this.x > canvasWidth ||
      this.y < -this.height ||
      this.y > canvasHeight
    ) {
      this.active = false
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color
    ctx.fillRect(this.x, this.y, this.width, this.height)

    // プレイヤーの弾に光彩効果
    if (this.isPlayerBullet) {
      ctx.save()
      ctx.globalAlpha = 0.3
      ctx.fillStyle = this.color
      ctx.fillRect(
        this.x - 2,
        this.y - 2,
        this.width + 4,
        this.height + 4
      )
      ctx.restore()
    }
  }
}
