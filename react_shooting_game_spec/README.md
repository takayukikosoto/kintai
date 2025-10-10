# React Integration Shooting Game Specification

## 1. Overview
This game module integrates into an existing React app. It renders via Canvas or WebGL and supports both PC and mobile.

## 2. Component Interface
```tsx
interface ShootingGameProps {
  width: number;
  height: number;
  difficulty: "easy" | "normal" | "hard";
  initialStage?: number;
  onGameOver: (stats: { score: number; stageReached: number; remainingContinues: number }) => void;
  onStageClear?: (stats: { score: number; nextStage: number }) => void;
}
```

## 3. Structure
```
/shooting-game/
  /src/
    ShootingGame.tsx
    game/
      GameCore.ts
      Player.ts
      Enemy.ts
      Bullet.ts
      WaveManager.ts
      Item.ts
      Background.ts
      InputManager.ts
      Pool.ts
      Collision.ts
    data/
      stage1.json
      bulletTypes.json
      enemyTypes.json
  /assets/
    images/
    sounds/
  package.json
  README.md
  tsconfig.json
```

## 4. Data Examples
### stage1.json
```json
{
  "stage": 1,
  "background": "bg_stage1.png",
  "scrollSpeed": 1.5,
  "waves": [
    {
      "time": 5.0,
      "enemies": [
        { "type": "small", "count": 10, "spawnXRange": [0.1, 0.9] },
        { "type": "zigzag", "count": 3, "spawnXRange": [0.2, 0.8] }
      ]
    },
    {
      "time": 15.0,
      "enemies": [
        { "type": "shooter", "count": 5, "spawnXRange": [0.0, 1.0] }
      ]
    },
    {
      "time": 25.0,
      "boss": { "type": "boss1", "hp": 100, "pattern": "patternA" }
    }
  ]
}
```

### bulletTypes.json
```json
{
  "arrow": { "speed": 8, "damage": 1, "pattern": "straight" },
  "gun": { "speed": 10, "damage": 1, "pattern": "straight" },
  "crescent": { "speed": 6, "damage": 1, "pattern": "boomerang" },
  "shotgun": { "speed": 7, "damage": 1, "pattern": "spread", "spreadCount": 5 }
}
```

### enemyTypes.json
```json
{
  "small": { "hp": 2, "speed": 2, "movementPattern": "straight", "dropRate": 0.1 },
  "zigzag": { "hp": 3, "speed": 1.8, "movementPattern": "zigzag", "dropRate": 0.15 },
  "shooter": { "hp": 4, "speed": 1.5, "movementPattern": "slow", "attackPattern": "shoot", "shootInterval": 2.0, "dropRate": 0.2 },
  "boss1": { "hp": 100, "speed": 1, "movementPattern": "bossPatternA", "attackPattern": "bossShots", "dropRate": 1.0 }
}
```
