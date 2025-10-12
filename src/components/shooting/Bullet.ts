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
  penetrate: boolean
  bounce: boolean
  bounceCount: number
  bounceRemaining: number
  isHammer: boolean
  hammerAngle: number
  hammerRadius: number
  hammerSpeed: number
  hammerOriginX: number
  hammerOriginY: number
  hammerBaseRadius: number
  isBoomerang: boolean
  boomerangState: 'outward' | 'return'
  boomerangTime: number
  boomerangStartX: number
  boomerangStartY: number
  boomerangTargetX: number
  boomerangTargetY: number

  constructor(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    color: string,
    size: number,
    isPlayerBullet: boolean,
    options?: {
      penetrate?: boolean
      bounce?: boolean
      bounceCount?: number
      isHammer?: boolean
      hammerRadius?: number
      hammerSpeed?: number
      isBoomerang?: boolean
      boomerangTargetX?: number
      boomerangTargetY?: number
    }
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
    this.penetrate = options?.penetrate || false
    this.bounce = options?.bounce || false
    this.bounceCount = options?.bounceCount || 0
    this.bounceRemaining = this.bounceCount
    this.isHammer = options?.isHammer || false
    this.hammerAngle = 0
    this.hammerRadius = options?.hammerRadius || 60
    this.hammerBaseRadius = options?.hammerRadius || 60
    this.hammerSpeed = options?.hammerSpeed || 0.1
    this.hammerOriginX = x
    this.hammerOriginY = y
    this.isBoomerang = options?.isBoomerang || false
    this.boomerangState = 'outward'
    this.boomerangTime = 0
    this.boomerangStartX = x
    this.boomerangStartY = y
    this.boomerangTargetX = options?.boomerangTargetX || x
    this.boomerangTargetY = options?.boomerangTargetY || 0
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number) {
    if (this.isHammer) {
      // モーニングスターはびよんびよんと大きく伸縮しながら回転
      this.hammerAngle += this.hammerSpeed
      // sin波で半径を大きく伸縮（0.3倍〜2.0倍）
      const stretchFactor = 1.15 + Math.sin(this.hammerAngle * 2.5) * 0.85
      this.hammerRadius = this.hammerBaseRadius * stretchFactor
      this.x = this.hammerOriginX + Math.cos(this.hammerAngle) * this.hammerRadius
      this.y = this.hammerOriginY + Math.sin(this.hammerAngle) * this.hammerRadius
      return
    }

    if (this.isBoomerang) {
      // ブーメラン挙動
      this.boomerangTime += deltaTime

      if (this.boomerangState === 'outward') {
        // 外に向かう（2秒間）
        const progress = Math.min(this.boomerangTime / 2.0, 1)
        const easeProgress = 1 - Math.pow(1 - progress, 3) // easeOutCubic
        
        this.x = this.boomerangStartX + (this.boomerangTargetX - this.boomerangStartX) * easeProgress
        this.y = this.boomerangStartY + (this.boomerangTargetY - this.boomerangStartY) * easeProgress
        
        // ゆらゆら揺れる
        const wobble = Math.sin(this.boomerangTime * 8) * 20
        this.x += wobble
        
        if (this.boomerangTime >= 2.0) {
          this.boomerangState = 'return'
          this.boomerangTime = 0
        }
      } else {
        // 寂しげに帰ってくる（1.5秒間）
        const progress = Math.min(this.boomerangTime / 1.5, 1)
        const easeProgress = progress * progress // easeInQuad
        
        this.x = this.boomerangTargetX + (this.boomerangStartX - this.boomerangTargetX) * easeProgress
        this.y = this.boomerangTargetY + (this.boomerangStartY - this.boomerangTargetY) * easeProgress
        
        // 帰りもゆらゆら
        const wobble = Math.sin(this.boomerangTime * 6) * 15
        this.x += wobble
        
        if (this.boomerangTime >= 1.5) {
          this.active = false
        }
      }
      return
    }

    this.x += this.vx * deltaTime * 60
    this.y += this.vy * deltaTime * 60

    // 跳ね返り処理
    if (this.bounce && this.bounceRemaining > 0) {
      if (this.x <= 0 || this.x >= canvasWidth - this.width) {
        this.vx *= -1
        this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x))
        this.bounceRemaining--
      }
      if (this.y <= 0 || this.y >= canvasHeight - this.height) {
        this.vy *= -1
        this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y))
        this.bounceRemaining--
      }
      
      if (this.bounceRemaining <= 0) {
        this.active = false
      }
      return
    }

    // 通常の画面外チェック
    if (
      this.x < -this.width ||
      this.x > canvasWidth ||
      this.y < -this.height ||
      this.y > canvasHeight
    ) {
      this.active = false
    }
  }
  
  updateHammerOrigin(x: number, y: number) {
    this.hammerOriginX = x
    this.hammerOriginY = y
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save()
    
    if (this.isHammer) {
      // モーニングスター描画
      const centerX = this.x + this.width / 2
      const centerY = this.y + this.height / 2
      
      // 鎖（複数のリング）
      const chainSegments = 8
      const dx = centerX - this.hammerOriginX
      const dy = centerY - this.hammerOriginY
      
      for (let i = 0; i < chainSegments; i++) {
        const t = i / chainSegments
        const x = this.hammerOriginX + dx * t
        const y = this.hammerOriginY + dy * t
        
        ctx.strokeStyle = '#374151'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.stroke()
      }
      
      // 鉄球本体
      const ballRadius = this.width / 2
      const gradient = ctx.createRadialGradient(
        centerX - ballRadius / 3,
        centerY - ballRadius / 3,
        0,
        centerX,
        centerY,
        ballRadius
      )
      gradient.addColorStop(0, '#9ca3af')
      gradient.addColorStop(0.7, '#6b7280')
      gradient.addColorStop(1, '#374151')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, ballRadius, 0, Math.PI * 2)
      ctx.fill()
      
      // 棘（8方向）
      const spikeCount = 8
      for (let i = 0; i < spikeCount; i++) {
        const angle = (Math.PI * 2 * i) / spikeCount
        const spikeLength = ballRadius * 0.6
        const baseX = centerX + Math.cos(angle) * ballRadius * 0.7
        const baseY = centerY + Math.sin(angle) * ballRadius * 0.7
        const tipX = centerX + Math.cos(angle) * (ballRadius + spikeLength)
        const tipY = centerY + Math.sin(angle) * (ballRadius + spikeLength)
        
        ctx.fillStyle = '#1f2937'
        ctx.beginPath()
        ctx.moveTo(tipX, tipY)
        ctx.lineTo(
          baseX + Math.cos(angle + Math.PI / 2) * 3,
          baseY + Math.sin(angle + Math.PI / 2) * 3
        )
        ctx.lineTo(
          baseX + Math.cos(angle - Math.PI / 2) * 3,
          baseY + Math.sin(angle - Math.PI / 2) * 3
        )
        ctx.closePath()
        ctx.fill()
      }
      
      // 鉄球のアウトライン
      ctx.strokeStyle = '#1f2937'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, ballRadius, 0, Math.PI * 2)
      ctx.stroke()
      
    } else if (this.penetrate) {
      // 矢
      const angle = Math.atan2(this.vy, this.vx)
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2)
      ctx.rotate(angle)
      
      // 矢じり
      ctx.fillStyle = this.color
      ctx.beginPath()
      ctx.moveTo(this.width / 2, 0)
      ctx.lineTo(-this.width / 2, -this.height / 3)
      ctx.lineTo(-this.width / 2, this.height / 3)
      ctx.closePath()
      ctx.fill()
      
      // 矢羽
      ctx.fillStyle = '#dc2626'
      ctx.fillRect(-this.width / 2, -this.height / 4, this.width / 3, this.height / 2)
      
    } else if (this.isBoomerang) {
      // ブーメラン（円月輪）
      const centerX = this.x + this.width / 2
      const centerY = this.y + this.height / 2
      const time = Date.now() / 100
      
      ctx.translate(centerX, centerY)
      ctx.rotate(time)
      
      // 外側の円
      ctx.strokeStyle = this.color
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2)
      ctx.stroke()
      
      // 内側の円
      ctx.beginPath()
      ctx.arc(0, 0, this.width / 3, 0, Math.PI * 2)
      ctx.stroke()
      
      // 刃
      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI / 2) * i
        ctx.save()
        ctx.rotate(angle)
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.moveTo(0, -this.width / 2)
        ctx.lineTo(this.width / 4, -this.width / 3)
        ctx.lineTo(-this.width / 4, -this.width / 3)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
      
    } else {
      // 通常の弾（散弾銃など）
      ctx.fillStyle = this.color
      ctx.beginPath()
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2)
      ctx.fill()

      // プレイヤーの弾に光彩効果
      if (this.isPlayerBullet) {
        ctx.globalAlpha = 0.3
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    
    ctx.restore()
  }
}
