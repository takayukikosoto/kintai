import { PlayerShip } from './Player'
import { EnemyShip } from './Enemy'
import { BulletObject } from './Bullet'
import { ItemDrop } from './Item'
import { checkCollision } from './Collision'
import type { StageData, BulletType, EnemyType, GameStats, Wave } from './types'

// データをインポート
import bulletTypesData from '../../data/shooting/bulletTypes.json'
import enemyTypesData from '../../data/shooting/enemyTypes.json'
import stage1Data from '../../data/shooting/stage1.json'

export class GameCore {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  private difficulty: 'easy' | 'normal' | 'hard'
  
  private player: PlayerShip
  private enemies: EnemyShip[]
  private bullets: BulletObject[]
  private items: ItemDrop[]
  
  private stageData: StageData
  private bulletTypes: Record<string, BulletType>
  private enemyTypes: Record<string, EnemyType>
  
  private score: number
  private gameTime: number
  private isGameOver: boolean
  private isPaused: boolean
  private stageCleared: boolean
  
  private keys: Set<string>
  private lastFrameTime: number
  
  private touchTarget: { x: number; y: number } | null
  private isTouching: boolean
  
  private waveQueue: Array<{ time: number; wave: Wave; spawned: boolean }>
  
  private onGameOver: (stats: GameStats) => void
  private onStageClear?: (stats: { score: number; nextStage: number }) => void

  constructor(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    difficulty: 'easy' | 'normal' | 'hard',
    onGameOver: (stats: GameStats) => void,
    onStageClear?: (stats: { score: number; nextStage: number }) => void
  ) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.width = width
    this.height = height
    this.difficulty = difficulty
    this.onGameOver = onGameOver
    this.onStageClear = onStageClear

    // データロード
    this.bulletTypes = bulletTypesData as Record<string, BulletType>
    this.enemyTypes = enemyTypesData as Record<string, EnemyType>
    this.stageData = stage1Data as StageData

    // ゲーム状態初期化
    this.player = new PlayerShip(width, height)
    this.enemies = []
    this.bullets = []
    this.items = []
    
    this.score = 0
    this.gameTime = 0
    this.isGameOver = false
    this.isPaused = false
    this.stageCleared = false
    
    this.keys = new Set()
    this.lastFrameTime = performance.now()
    
    this.touchTarget = null
    this.isTouching = false
    
    // ウェーブキューを初期化
    this.waveQueue = this.stageData.waves.map(wave => ({
      time: wave.time,
      wave,
      spawned: false
    }))

    // イベントリスナー
    this.setupEventListeners()
  }

  private setupEventListeners() {
    // キーボード操作
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase())
      
      // スペースキーで射撃
      if (e.key === ' ' && !this.isGameOver) {
        e.preventDefault()
        this.playerShoot()
      }
    })

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase())
    })

    // タッチ操作
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      const rect = this.canvas.getBoundingClientRect()
      this.touchTarget = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }
      this.isTouching = true
    })

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      if (!this.isTouching) return
      const touch = e.touches[0]
      const rect = this.canvas.getBoundingClientRect()
      this.touchTarget = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }
    })

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault()
      this.isTouching = false
      this.touchTarget = null
    })

    // マウス操作（PC用）
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect()
      this.touchTarget = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
      this.isTouching = true
    })

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isTouching) return
      const rect = this.canvas.getBoundingClientRect()
      this.touchTarget = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    })

    this.canvas.addEventListener('mouseup', () => {
      this.isTouching = false
      this.touchTarget = null
    })
  }

  start() {
    this.gameLoop()
  }

  private gameLoop = () => {
    if (this.isGameOver || this.stageCleared) return

    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastFrameTime) / 1000
    this.lastFrameTime = currentTime

    if (!this.isPaused) {
      this.update(deltaTime)
    }
    
    this.render()

    requestAnimationFrame(this.gameLoop)
  }

  private update(deltaTime: number) {
    this.gameTime += deltaTime

    // プレイヤー移動
    this.handlePlayerMovement(deltaTime)

    // 自動射撃（スマホ対応）
    this.playerShoot()

    // オブジェクト更新
    this.player.update(deltaTime, this.width, this.height)
    this.bullets.forEach(b => b.update(deltaTime, this.width, this.height))
    this.enemies.forEach(e => e.update(deltaTime, this.width, this.height))
    this.items.forEach(i => i.update(deltaTime, this.width, this.height))

    // ウェーブスポーン
    this.spawnWaves()

    // 敵の射撃
    this.enemyShoot()

    // 衝突判定
    this.checkCollisions()

    // 非アクティブなオブジェクトを削除
    this.bullets = this.bullets.filter(b => b.active)
    this.enemies = this.enemies.filter(e => e.active)
    this.items = this.items.filter(i => i.active)

    // ゲームオーバー判定
    if (!this.player.active) {
      this.gameOver()
    }

    // ステージクリア判定
    if (this.gameTime >= this.stageData.duration && this.enemies.length === 0) {
      this.stageClear()
    }
  }

  private handlePlayerMovement(deltaTime: number) {
    let dx = 0
    let dy = 0

    // タッチ/マウス操作優先
    if (this.touchTarget) {
      const playerCenterX = this.player.x + this.player.width / 2
      const playerCenterY = this.player.y + this.player.height / 2
      
      const targetDx = this.touchTarget.x - playerCenterX
      const targetDy = this.touchTarget.y - playerCenterY
      const distance = Math.sqrt(targetDx * targetDx + targetDy * targetDy)

      // 距離が近すぎる場合は移動しない
      if (distance > 10) {
        dx = targetDx / distance
        dy = targetDy / distance

        // スムーズな移動のため、距離に応じて速度調整
        const speedMultiplier = Math.min(distance / 50, 1.5)
        dx *= speedMultiplier
        dy *= speedMultiplier
      }
    } else {
      // キーボード操作
      if (this.keys.has('arrowleft') || this.keys.has('a')) dx -= 1
      if (this.keys.has('arrowright') || this.keys.has('d')) dx += 1
      if (this.keys.has('arrowup') || this.keys.has('w')) dy -= 1
      if (this.keys.has('arrowdown') || this.keys.has('s')) dy += 1

      // 正規化
      if (dx !== 0 || dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy)
        dx /= length
        dy /= length
      }
    }

    this.player.move(dx, dy, this.width, this.height)
  }

  private playerShoot() {
    if (!this.player.canShoot(this.gameTime)) return

    const centerX = this.player.x + this.player.width / 2
    const centerY = this.player.y

    // 武器タイプに応じて弾を発射
    switch (this.player.weaponType) {
      case 'normal': {
        const bulletType = this.bulletTypes.player_normal
        const bullet = new BulletObject(
          centerX - bulletType.size / 2,
          centerY,
          0,
          -bulletType.speed,
          bulletType.damage,
          bulletType.color,
          bulletType.size,
          true
        )
        this.bullets.push(bullet)
        break
      }
      
      case 'spread': {
        const bulletType = this.bulletTypes.player_spread
        const angles = [-20, 0, 20]
        angles.forEach(angle => {
          const rad = (angle * Math.PI) / 180
          const bullet = new BulletObject(
            centerX - bulletType.size / 2,
            centerY,
            Math.sin(rad) * bulletType.speed,
            -Math.cos(rad) * bulletType.speed,
            bulletType.damage,
            bulletType.color,
            bulletType.size,
            true
          )
          this.bullets.push(bullet)
        })
        break
      }
      
      case 'rapid': {
        const bulletType = this.bulletTypes.player_rapid
        const bullet = new BulletObject(
          centerX - bulletType.size / 2,
          centerY,
          0,
          -bulletType.speed,
          bulletType.damage,
          bulletType.color,
          bulletType.size,
          true
        )
        this.bullets.push(bullet)
        break
      }
    }

    this.player.shoot(this.gameTime)
  }
  
  changeWeapon(weaponType: 'normal' | 'spread' | 'rapid') {
    this.player.setWeapon(weaponType)
  }

  private spawnWaves() {
    this.waveQueue.forEach(waveItem => {
      if (!waveItem.spawned && this.gameTime >= waveItem.time) {
        waveItem.spawned = true
        const wave = waveItem.wave

        // 通常の敵
        if (wave.enemies) {
          wave.enemies.forEach(enemyGroup => {
            for (let i = 0; i < enemyGroup.count; i++) {
              setTimeout(() => {
                const xRange = enemyGroup.spawnXRange
                const x = this.width * (xRange[0] + Math.random() * (xRange[1] - xRange[0]))
                const enemyTypeData = this.enemyTypes[enemyGroup.type]
                
                const enemy = new EnemyShip(
                  enemyGroup.type,
                  enemyTypeData,
                  x,
                  -enemyTypeData.size
                )
                this.enemies.push(enemy)
              }, i * enemyGroup.interval * 1000)
            }
          })
        }

        // ボス
        if (wave.boss) {
          const bossTypeData = this.enemyTypes[wave.boss.type]
          const boss = new EnemyShip(
            wave.boss.type,
            bossTypeData,
            this.width * wave.boss.spawnX - bossTypeData.size / 2,
            -bossTypeData.size
          )
          this.enemies.push(boss)
        }
      }
    })
  }

  private enemyShoot() {
    this.enemies.forEach(enemy => {
      if (enemy.canShoot(this.gameTime)) {
        enemy.shoot(this.gameTime)

        const bulletType = this.bulletTypes.enemy_normal
        const centerX = enemy.x + enemy.width / 2
        const centerY = enemy.y + enemy.height

        // プレイヤーに向かって撃つ
        const playerCenterX = this.player.x + this.player.width / 2
        const playerCenterY = this.player.y + this.player.height / 2
        
        const dx = playerCenterX - centerX
        const dy = playerCenterY - centerY
        const length = Math.sqrt(dx * dx + dy * dy)
        
        const vx = (dx / length) * bulletType.speed
        const vy = (dy / length) * bulletType.speed

        const bullet = new BulletObject(
          centerX - bulletType.size / 2,
          centerY,
          vx,
          vy,
          bulletType.damage,
          bulletType.color,
          bulletType.size,
          false
        )

        this.bullets.push(bullet)
      }
    })
  }

  private checkCollisions() {
    // プレイヤーの弾 vs 敵
    this.bullets.forEach(bullet => {
      if (!bullet.isPlayerBullet || !bullet.active) return

      this.enemies.forEach(enemy => {
        if (!enemy.active) return

        if (checkCollision(bullet, enemy)) {
          bullet.active = false
          const destroyed = enemy.takeDamage(bullet.damage)
          
          if (destroyed) {
            this.score += enemy.score

            // アイテムドロップ
            if (Math.random() < enemy.dropRate) {
              const itemType = Math.random() < 0.7 ? 'score' : 'health'
              const item = new ItemDrop(
                enemy.x + enemy.width / 2,
                enemy.y + enemy.height / 2,
                itemType
              )
              this.items.push(item)
            }
          }
        }
      })
    })

    // 敵の弾 vs プレイヤー
    this.bullets.forEach(bullet => {
      if (bullet.isPlayerBullet || !bullet.active) return

      if (checkCollision(bullet, this.player)) {
        bullet.active = false
        this.player.takeDamage(bullet.damage)
      }
    })

    // 敵 vs プレイヤー
    this.enemies.forEach(enemy => {
      if (!enemy.active) return

      if (checkCollision(enemy, this.player)) {
        enemy.active = false
        this.player.takeDamage(1)
      }
    })

    // アイテム vs プレイヤー
    this.items.forEach(item => {
      if (!item.active) return

      if (checkCollision(item, this.player)) {
        item.active = false

        switch (item.type) {
          case 'health':
            this.player.heal(1)
            break
          case 'score':
            this.score += 500
            break
        }
      }
    })
  }

  private render() {
    // キャンバスをクリア
    this.ctx.clearRect(0, 0, this.width, this.height)
    
    // 背景
    this.ctx.save()
    this.ctx.fillStyle = '#0f172a'
    this.ctx.fillRect(0, 0, this.width, this.height)
    this.ctx.restore()

    // スクロール背景（星）
    this.ctx.save()
    this.renderStarfield()
    this.ctx.restore()

    // ゲームオブジェクト（レイヤー順に描画）
    // 1. 敵の弾（最背面）
    this.ctx.save()
    this.bullets.filter(b => !b.isPlayerBullet).forEach(b => b.render(this.ctx))
    this.ctx.restore()
    
    // 2. 敵機
    this.ctx.save()
    this.enemies.forEach(e => e.render(this.ctx))
    this.ctx.restore()
    
    // 3. アイテム
    this.ctx.save()
    this.items.forEach(i => i.render(this.ctx))
    this.ctx.restore()
    
    // 4. プレイヤーの弾
    this.ctx.save()
    this.bullets.filter(b => b.isPlayerBullet).forEach(b => b.render(this.ctx))
    this.ctx.restore()
    
    // 5. プレイヤー機（最前面）
    this.ctx.save()
    this.player.render(this.ctx)
    this.ctx.restore()

    // UI（常に最前面）
    this.ctx.save()
    this.renderUI()
    this.ctx.restore()
  }

  private renderStarfield() {
    const starCount = 50
    const seed = Math.floor(this.gameTime * 20)
    
    for (let i = 0; i < starCount; i++) {
      const x = (i * 137.508) % this.width
      const y = ((i * 137.508 + seed) % this.height)
      const size = (i % 3) + 1
      
      this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + (i % 3) * 0.2})`
      this.ctx.fillRect(x, y, size, size)
    }
  }

  private renderUI() {
    this.ctx.fillStyle = 'white'
    this.ctx.font = 'bold 20px Arial'
    this.ctx.textAlign = 'left'
    
    // スコア
    this.ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, 20, 30)
    
    // HP
    this.ctx.fillText(`HP: `, 20, 60)
    for (let i = 0; i < this.player.maxHp; i++) {
      this.ctx.fillStyle = i < this.player.hp ? '#22c55e' : '#4b5563'
      this.ctx.fillRect(70 + i * 30, 45, 25, 20)
    }
    
    // 時間
    const timeLeft = Math.max(0, this.stageData.duration - this.gameTime)
    this.ctx.fillStyle = 'white'
    this.ctx.fillText(`TIME: ${timeLeft.toFixed(1)}s`, 20, 90)
  }

  private gameOver() {
    this.isGameOver = true
    
    const stats: GameStats = {
      score: this.score,
      stageReached: this.stageData.stage,
      remainingContinues: 0
    }
    
    setTimeout(() => {
      this.onGameOver(stats)
    }, 1000)
  }

  private stageClear() {
    this.stageCleared = true
    
    if (this.onStageClear) {
      this.onStageClear({
        score: this.score,
        nextStage: this.stageData.stage + 1
      })
    }
  }

  getPlayer() {
    return this.player
  }

  cleanup() {
    // イベントリスナーのクリーンアップは省略（本番では必要）
  }
}
