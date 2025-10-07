# 🚧 デバッグ用メモ

## ✅ スライムゲームの制限を復活しました（2025-10-07 20:01）

**練習ページを作成しました**: `/slime-practice`
- 制限なしで何度でもプレイ可能
- スコア記録なし、報酬なし

## ~~スライムゲームの制限を一時的に無効化中~~（復活済み）

### 変更箇所
**ファイル**: `/Users/k_kintai/src/pages/HomePage.tsx`
**関数**: `checkCanPlayGame()`

### 無効化した制限
1. ✅ **時間制限**: 12:00以降のみ → **常時プレイ可能**
2. ✅ **回数制限**: 1日1回 → **何度でもプレイ可能**

### 制限を戻す手順

#### 方法1: コメントの切り替え
```typescript
async function checkCanPlayGame() {
  // 🚧 DEBUG MODE: 制限を一時的に無効化
  // TODO: デバッグ後に下記のコメントを外して制限を戻す
  setCanPlayGame(true)  // ← この2行を削除またはコメントアウト
  return                // ←

  /* 本番用の制限コード（デバッグ後に有効化）  // ← このコメントを外す
  try {
    const now = new Date()
    const hour = now.getHours()
    
    // 12時以降のみゲーム可能
    if (hour < 12) {
      setCanPlayGame(false)
      return
    }

    // 今日既にプレイしたかチェック
    const today = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-')

    const q = query(
      collection(db, 'slimeGames'),
      where('userId', '==', userId),
      where('date', '==', today),
      limit(1)
    )
    const snap = await getDocs(q)
    
    setCanPlayGame(snap.empty)
  } catch (error) {
    console.error('ゲーム可否チェックエラー:', error)
  }
  */  // ← このコメント終了も外す
}
```

#### 方法2: Gitで戻す
```bash
git checkout HEAD -- src/pages/HomePage.tsx
```

---

## デバッグ完了後の確認事項

- [ ] `setCanPlayGame(true)` を削除
- [ ] `return` を削除
- [ ] コメントアウトを解除
- [ ] 12:00前にゲームボタンが表示されないことを確認
- [ ] 1日1回制限が機能することを確認
- [ ] コミット & デプロイ

---

**作成日時**: 2025-10-07 19:13
**目的**: スライムゲームのデバッグ
