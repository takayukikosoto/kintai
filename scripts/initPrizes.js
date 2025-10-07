#!/usr/bin/env node

/**
 * 抽選景品の初期データを登録するスクリプト
 * 
 * 使い方:
 * node scripts/initPrizes.js
 */

import admin from 'firebase-admin'

// Firebase Admin初期化
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'kintai-f16b6'
  })
}

const db = admin.firestore()

const prizes = [
  {
    name: 'ゲームソフト',
    emoji: '🎮',
    rarity: 'ssr',
    probability: 0.02,
    enabled: true,
    order: 0
  },
  {
    name: 'ウィダーインゼリー',
    emoji: '🥤',
    rarity: 'normal',
    probability: 10,
    enabled: true,
    order: 1
  },
  {
    name: 'ミネラルウォーター',
    emoji: '💧',
    rarity: 'normal',
    probability: 10,
    enabled: true,
    order: 2
  },
  {
    name: 'チュッパチャプス',
    emoji: '🍬',
    rarity: 'normal',
    probability: 10,
    enabled: true,
    order: 3
  },
  {
    name: '駄菓子',
    emoji: '🍘',
    rarity: 'normal',
    probability: 20,
    enabled: true,
    order: 4
  },
  {
    name: 'ハズレ（ティッシュ1個）',
    emoji: '🧻',
    rarity: 'normal',
    probability: 49.98,
    enabled: true,
    order: 5
  }
]

async function initPrizes() {
  try {
    console.log('🎰 景品データを登録中...\n')

    // 既存の景品をチェック
    const existingPrizes = await db.collection('prizes').get()
    if (!existingPrizes.empty) {
      console.log('⚠️  既に景品が登録されています。')
      console.log(`   現在の景品数: ${existingPrizes.size}件\n`)
      console.log('既存データを削除して再登録しますか？ (y/N): ')
      
      // 簡易的な確認（実際のプロダクションではreadline等を使用）
      const args = process.argv.slice(2)
      if (!args.includes('--force')) {
        console.log('削除せずに終了します。')
        console.log('強制的に再登録する場合は --force オプションを付けてください。')
        process.exit(0)
      }

      console.log('既存データを削除中...')
      const batch = db.batch()
      existingPrizes.docs.forEach(doc => {
        batch.delete(doc.ref)
      })
      await batch.commit()
      console.log('✓ 削除完了\n')
    }

    // 新規登録
    const now = new Date().toISOString()
    let totalProbability = 0

    for (const prize of prizes) {
      const prizeData = {
        ...prize,
        createdAt: now,
        updatedAt: now
      }
      
      await db.collection('prizes').add(prizeData)
      totalProbability += prize.probability
      
      const rarityLabel = prize.rarity === 'ssr' ? '🏆 SSR' : '🎁'
      console.log(`${rarityLabel} ${prize.emoji} ${prize.name} - ${prize.probability}%`)
    }

    console.log('\n' + '='.repeat(50))
    console.log(`✓ 合計 ${prizes.length} 件の景品を登録しました`)
    console.log(`✓ 合計確率: ${totalProbability.toFixed(2)}%`)
    console.log('='.repeat(50) + '\n')

    console.log('🎉 初期化完了！')
    console.log('開発サーバーで「🎰 抽選設定」ページを確認してください。')
    
  } catch (error) {
    console.error('❌ エラー:', error.message)
    process.exit(1)
  }
}

initPrizes().then(() => process.exit(0))
