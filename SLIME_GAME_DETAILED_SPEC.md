# 🎮 スライムシューター 超詳細仕様書 v2.0

## 🎯 最優先目標
**「バネで引っ張るような、気持ちいい物理演算」の実装**

---

## 💫 バネ感の完全定義

### 1. バネの物理モデル

#### 基本方程式（フックの法則）
```typescript
// バネの力 F = -k * x
// k: バネ定数（硬さ）
// x: バネの伸び

const SPRING_CONSTANT = 0.15  // バネ定数（0.1-0.3が気持ちいい）
const DAMPING = 0.92          // 減衰係数（0.9-0.95）
const MASS = 1.0              // スライムの質量

// 引っ張り中の力の計算
function calculateSpringForce(dragDistance: number) {
  const force = -SPRING_CONSTANT * dragDistance
  const acceleration = force / MASS
  return acceleration
}
```

#### 引っ張り時の動き
```typescript
class SpringPhysics {
  position: Vector2
  velocity: Vector2
  anchor: Vector2  // 固定点（発射位置）
  
  update(deltaTime: number) {
    // 1. バネの力を計算
    const displacement = this.position.subtract(this.anchor)
    const springForce = displacement.multiply(-SPRING_CONSTANT)
    
    // 2. 加速度を計算
    const acceleration = springForce.divide(MASS)
    
    // 3. 速度を更新（減衰を適用）
    this.velocity = this.velocity.add(acceleration).multiply(DAMPING)
    
    // 4. 位置を更新
    this.position = this.position.add(this.velocity)
  }
}
```

### 2. 引っ張り演出の段階的定義

#### Phase 1: タッチ開始
```
時間: 0ms
- スライムが指に「吸い付く」ように移動
- イージング: easeOutCubic (0.15秒)
- エフェクト: 小さな波紋
```

#### Phase 2: 引っ張り中（バネ伸縮）
```
リアルタイム更新（60fps）

ビジュアル変化:
1. スライム本体の変形
   - 引っ張り方向に伸びる（ellipse）
   - 伸び率 = min(distance / 100, 2.0)
   - width = radius * (1 + stretch * 0.5)
   - height = radius * (1 - stretch * 0.3)

2. バネの可視化
   - スライムと固定点を結ぶライン
   - 太さ: 引っ張り力に比例（2-8px）
   - 色: パワーに応じてグラデーション
     - 0-30%: #60a5fa (青)
     - 30-70%: #fbbf24 (黄)
     - 70-100%: #ef4444 (赤)
   - アニメーション: 波打つエフェクト（sin波）

3. パワーインジケーター
   - 円形ゲージ（スライムの周り）
   - 0-100%で色変化
   - パルス効果（80%以上で点滅）

4. バネの「震え」
   - 引っ張り量に応じた微振動
   - frequency = dragDistance * 0.1
   - amplitude = 2-5px
```

#### Phase 3: 発射直前（ピーク）
```
タイミング: タッチを離す瞬間

0.1秒間のアニメーション:
1. スライムが最大圧縮（squash）
   - scaleY = 0.7
   - scaleX = 1.3
   
2. 発光エフェクト
   - 白いフラッシュ（opacity: 0.8 → 0）
   
3. パーティクル予兆
   - 小さな火花が周囲に散る（5-10個）
```

#### Phase 4: 発射瞬間
```
0フレーム（即座）

ビジュアル:
1. スライムが伸長（stretch）
   - scaleY = 1.5
   - scaleX = 0.8
   - 飛行方向に向かって変形

2. 爆発パーティクル
   - 発射地点に爆発（30-50個）
   - 色: 青→白のグラデーション
   - 速度: 放射状に拡散

3. 煙エフェクト
   - 発射地点に残る煙（3-5個）
   - ゆっくり上昇＆フェードアウト

4. 画面シェイク
   - 振幅: パワーに比例（2-8px）
   - 持続: 0.1秒
```

### 3. 飛行中の物理演算

```typescript
class FlightPhysics {
  position: Vector2
  velocity: Vector2
  rotation: number = 0
  rotationVelocity: number = 5  // 回転速度
  
  // 定数
  GRAVITY = 0.4           // 重力（0.3-0.5）
  AIR_RESISTANCE = 0.995  // 空気抵抗（0.99-0.999）
  TERMINAL_VELOCITY = 30   // 終端速度
  
  update(deltaTime: number) {
    // 1. 重力を適用
    this.velocity.y += GRAVITY * deltaTime
    
    // 2. 空気抵抗
    this.velocity = this.velocity.multiply(AIR_RESISTANCE)
    
    // 3. 終端速度制限
    const speed = this.velocity.length()
    if (speed > TERMINAL_VELOCITY) {
      this.velocity = this.velocity.normalize().multiply(TERMINAL_VELOCITY)
    }
    
    // 4. 位置更新
    this.position = this.position.add(this.velocity.multiply(deltaTime))
    
    // 5. 回転（速度に応じて）
    this.rotation += this.rotationVelocity * (speed / 10)
    
    // 6. 変形（速度ベクトルに応じて）
    this.updateSquashStretch()
  }
  
  updateSquashStretch() {
    // 速度方向に伸びる
    const speed = this.velocity.length()
    const stretchFactor = Math.min(speed / 15, 1.5)
    
    this.scaleX = 1 + stretchFactor * 0.3
    this.scaleY = 1 - stretchFactor * 0.2
  }
}
```

### 4. スライムの「ぷるぷる」振動

```typescript
class JellyWobble {
  wobblePhase: number = 0
  wobbleAmplitude: number = 0
  wobbleFrequency: number = 15  // Hz
  
  // トリガー: 発射時、着地時、当たり判定時
  trigger(intensity: number = 1.0) {
    this.wobbleAmplitude = intensity * 0.3  // 最大30%変形
    this.wobblePhase = 0
  }
  
  update(deltaTime: number) {
    if (this.wobbleAmplitude <= 0.01) return
    
    // 減衰振動
    this.wobblePhase += this.wobbleFrequency * deltaTime
    this.wobbleAmplitude *= 0.92  // 減衰
    
    // 変形を計算
    const wobble = Math.sin(this.wobblePhase) * this.wobbleAmplitude
    
    return {
      scaleX: 1 + wobble,
      scaleY: 1 - wobble
    }
  }
}
```

---

## 🎨 スライムの描画仕様

### ベースシェイプ
```typescript
function drawSlime(ctx: CanvasRenderingContext2D, slime: Slime) {
  const { x, y, radius, scaleX, scaleY, rotation, color } = slime
  
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  
  // グラデーション（立体感）
  const gradient = ctx.createRadialGradient(
    -radius * 0.3, -radius * 0.3, 0,  // 光源（左上）
    0, 0, radius
  )
  gradient.addColorStop(0, '#93c5fd')    // 明るい青
  gradient.addColorStop(0.6, '#60a5fa')  // 中間
  gradient.addColorStop(1, '#3b82f6')    // 濃い青
  
  // 本体
  ctx.beginPath()
  ctx.ellipse(
    0, 0,
    radius * scaleX,
    radius * scaleY,
    0, 0, Math.PI * 2
  )
  ctx.fillStyle = gradient
  ctx.fill()
  
  // ハイライト（ぷるぷる感）
  ctx.globalAlpha = 0.6
  ctx.beginPath()
  ctx.ellipse(
    -radius * 0.25, -radius * 0.25,
    radius * 0.4, radius * 0.3,
    -0.3, 0, Math.PI * 2
  )
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.fill()
  
  // 影（接地感）
  if (slime.isGrounded) {
    ctx.globalAlpha = 0.3
    ctx.fillStyle = '#000'
    ctx.fillRect(
      -radius * scaleX * 0.8,
      radius * scaleY * 0.9,
      radius * scaleX * 1.6,
      radius * 0.2
    )
  }
  
  ctx.restore()
}
```

### トレイルエフェクト
```typescript
class Trail {
  points: Array<{x, y, alpha, scale}> = []
  maxPoints = 20
  
  add(x: number, y: number) {
    this.points.unshift({ x, y, alpha: 1.0, scale: 1.0 })
    if (this.points.length > this.maxPoints) {
      this.points.pop()
    }
  }
  
  update() {
    this.points.forEach((point, i) => {
      point.alpha -= 0.05
      point.scale -= 0.03
    })
    this.points = this.points.filter(p => p.alpha > 0)
  }
  
  draw(ctx: CanvasRenderingContext2D, radius: number) {
    this.points.forEach(point => {
      ctx.globalAlpha = point.alpha
      ctx.beginPath()
      ctx.arc(point.x, point.y, radius * point.scale, 0, Math.PI * 2)
      ctx.fillStyle = '#60a5fa'
      ctx.fill()
    })
    ctx.globalAlpha = 1.0
  }
}
```

---

## 🎯 ターゲットの動きの定義

### 浮遊パターン
```typescript
class FloatingTarget {
  baseY: number
  floatPhase: number = Math.random() * Math.PI * 2
  floatAmplitude: number = 15  // 上下15px
  floatSpeed: number = 2       // 速度
  
  update(time: number) {
    this.floatPhase += this.floatSpeed * 0.01
    this.y = this.baseY + Math.sin(this.floatPhase) * this.floatAmplitude
    
    // 回転
    this.rotation += 0.02
  }
}
```

### レアリティ別エフェクト

#### 💎 200pt（レア）
```typescript
{
  // オーラ
  glow: {
    color: '#ffd700',
    radius: 40,
    pulseSpeed: 2,
    animation: 'pulse'  // 明滅
  },
  
  // パーティクル
  particles: {
    count: 3,
    type: 'sparkle',
    spawnRate: 0.1  // 毎フレーム10%の確率
  },
  
  // 回転速度
  rotationSpeed: 0.05
}
```

---

## ✨ パーティクルシステム完全定義

### 種類と用途
```typescript
enum ParticleType {
  // 発射時
  LAUNCH_SPARK,    // 発射地点の火花（30個）
  LAUNCH_SMOKE,    // 発射後の煙（5個）
  
  // 飛行中
  TRAIL,           // 軌跡（連続生成）
  
  // 当たり判定
  HIT_EXPLOSION,   // 爆発（50個、放射状）
  HIT_STAR,        // 星型（高得点時、10個）
  SCORE_POP,       // スコア表示（1個、フェード）
  
  // ゲーム終了
  CONFETTI,        // 紙吹雪（100個）
}
```

### 詳細パラメータ
```typescript
const PARTICLE_CONFIGS = {
  LAUNCH_SPARK: {
    count: 30,
    lifetime: 0.5,  // 秒
    speed: { min: 5, max: 15 },
    angle: 'random',  // 360度
    color: ['#60a5fa', '#93c5fd', '#ffffff'],
    size: { min: 2, max: 4 },
    gravity: 0.2,
    fadeOut: true,
    glow: true  // 発光エフェクト
  },
  
  HIT_EXPLOSION: {
    count: 50,
    lifetime: 0.8,
    speed: { min: 3, max: 12 },
    angle: 'radial',  // 放射状
    color: (points) => points >= 200 ? '#ffd700' : '#60a5fa',
    size: { min: 3, max: 8 },
    gravity: 0.3,
    rotation: true,  // 回転する
    bounce: 0.5      // 反発係数
  },
  
  SCORE_POP: {
    count: 1,
    lifetime: 1.0,
    motion: 'float-up',  // 上に浮遊
    text: `+${points}`,
    fontSize: points >= 200 ? 32 : 24,
    color: points >= 200 ? '#ffd700' : '#ffffff',
    animation: 'scale-in-out'  // 大きく→小さく
  }
}
```

---

## 📊 パフォーマンス目標

```
FPS: 60 (必達)
描画オブジェクト: 最大200個まで
メモリ: 50MB以下
モバイル対応: iOS Safari, Chrome (60fps維持)
```

---

## 🎮 入力処理の改善

### タッチ遅延の削減
```typescript
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault()  // スクロール防止
  // ...
}, { passive: false })
```

### スムーズな追従
```typescript
// 60fps補間
const LERP_SPEED = 0.3

function updateDrag(targetX: number, targetY: number) {
  slime.x += (targetX - slime.x) * LERP_SPEED
  slime.y += (targetY - slime.y) * LERP_SPEED
}
```

---

## 実装チェックリスト

### Phase 1: バネ物理（必須）
- [ ] SpringPhysics クラス実装
- [ ] 引っ張り中の力の可視化（バネライン）
- [ ] パワーインジケーター
- [ ] 発射時のsquash/stretch

### Phase 2: スライム描画（必須）
- [ ] グラデーション付き円形描画
- [ ] ぷるぷる振動（JellyWobble）
- [ ] トレイルエフェクト
- [ ] 回転アニメーション

### Phase 3: パーティクル（必須）
- [ ] 発射時エフェクト
- [ ] 当たり判定エフェクト
- [ ] スコアポップ

### Phase 4: ターゲット動き（推奨）
- [ ] 浮遊アニメーション
- [ ] レアリティエフェクト

### Phase 5: 仕上げ（オプション）
- [ ] 画面シェイク
- [ ] コンボシステム
- [ ] 効果音

---

**この仕様で実装します！**
