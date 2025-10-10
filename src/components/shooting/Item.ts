import type { Item } from './types'

export class ItemDrop implements Item {
  x: number
  y: number
  width: number
  height: number
  active: boolean
  type: 'powerup' | 'health' | 'score'
  vy: number

  constructor(x: number, y: number, type: 'powerup' | 'health' | 'score') {
    this.x = x
    this.y = y
    this.width = 20
    this.height = 20
    this.active = true
    this.type = type
    this.vy = 2
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number) {
    this.y += this.vy

    // 画面外に出たら非アクティブ
    if (this.y > canvasHeight) {
      this.active = false
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save()

    const centerX = this.x + this.width / 2
    const centerY = this.y + this.height / 2

    // タイプに応じて色と形を変える
    switch (this.type) {
      case 'powerup':
        // 青い星
        ctx.fillStyle = '#3b82f6'
        ctx.strokeStyle = '#1d4ed8'
        this.drawStar(ctx, centerX, centerY, 5, this.width / 2, this.width / 4)
        break
      
      case 'health':
        // 緑のハート
        ctx.fillStyle = '#22c55e'
        ctx.strokeStyle = '#16a34a'
        this.drawHeart(ctx, centerX, centerY, this.width / 2)
        break
      
      case 'score':
        // 金色のコイン
        ctx.fillStyle = '#eab308'
        ctx.strokeStyle = '#ca8a04'
        ctx.beginPath()
        ctx.arc(centerX, centerY, this.width / 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        break
    }

    ctx.restore()
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) {
    let rot = (Math.PI / 2) * 3
    let x = cx
    let y = cy
    const step = Math.PI / spikes

    ctx.beginPath()
    ctx.moveTo(cx, cy - outerRadius)
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius
      y = cy + Math.sin(rot) * outerRadius
      ctx.lineTo(x, y)
      rot += step

      x = cx + Math.cos(rot) * innerRadius
      y = cy + Math.sin(rot) * innerRadius
      ctx.lineTo(x, y)
      rot += step
    }
    ctx.lineTo(cx, cy - outerRadius)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  private drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
    ctx.beginPath()
    const topCurveHeight = size * 0.3
    ctx.moveTo(cx, cy + size / 4)
    
    // 左側のカーブ
    ctx.bezierCurveTo(
      cx, cy,
      cx - size / 2, cy,
      cx - size / 2, cy + topCurveHeight
    )
    ctx.bezierCurveTo(
      cx - size / 2, cy + (size + topCurveHeight) / 2,
      cx, cy + (size + topCurveHeight) / 1.2,
      cx, cy + size
    )
    
    // 右側のカーブ
    ctx.bezierCurveTo(
      cx, cy + (size + topCurveHeight) / 1.2,
      cx + size / 2, cy + (size + topCurveHeight) / 2,
      cx + size / 2, cy + topCurveHeight
    )
    ctx.bezierCurveTo(
      cx + size / 2, cy,
      cx, cy,
      cx, cy + size / 4
    )
    
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
}
