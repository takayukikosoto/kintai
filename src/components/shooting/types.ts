export interface Vector2 {
  x: number
  y: number
}

export interface GameObject {
  x: number
  y: number
  width: number
  height: number
  active: boolean
}

export interface BulletType {
  speed: number
  damage: number
  pattern: 'straight' | 'spread' | 'aimed' | 'boomerang'
  spreadCount?: number
  spreadAngle?: number
  color: string
  size: number
}

export interface EnemyType {
  hp: number
  speed: number
  movementPattern: string
  attackPattern: string | null
  shootInterval: number
  dropRate: number
  score: number
  color: string
  size: number
}

export interface Bullet extends GameObject {
  vx: number
  vy: number
  damage: number
  color: string
  isPlayerBullet: boolean
}

export interface Enemy extends GameObject {
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
}

export interface Player extends GameObject {
  hp: number
  maxHp: number
  speed: number
  shootCooldown: number
  lastShotTime: number
  invincible: boolean
  invincibleTime: number
}

export interface Item extends GameObject {
  type: 'powerup' | 'health' | 'score'
  vy: number
}

export interface WaveEnemy {
  type: string
  count: number
  spawnXRange: [number, number]
  interval: number
}

export interface Wave {
  time: number
  enemies?: WaveEnemy[]
  boss?: {
    type: string
    spawnX: number
  }
}

export interface StageData {
  stage: number
  name: string
  scrollSpeed: number
  duration: number
  waves: Wave[]
}

export interface GameStats {
  score: number
  stageReached: number
  remainingContinues: number
}
