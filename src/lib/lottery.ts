import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import type { Prize, LotteryResult, LotterySlot } from '../types'

/**
 * 抽選を実行
 * @param userId ユーザーID
 * @param slot 抽選枠（morning or lunch）
 * @returns 当選した景品（なければnull）
 */
export async function executeLottery(userId: string, slot: LotterySlot): Promise<Prize | null> {
  // 1. 今日の日付を取得
  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-')

  // 2. 既に抽選済みかチェック
  const existingQ = query(
    collection(db, 'lotteryResults'),
    where('userId', '==', userId),
    where('date', '==', today),
    where('slot', '==', slot)
  )
  const existingSnap = await getDocs(existingQ)
  
  if (!existingSnap.empty) {
    // 既に抽選済み
    return null
  }

  // 3. 有効な景品を取得
  const prizesQ = query(
    collection(db, 'prizes'),
    where('enabled', '==', true),
    orderBy('order', 'asc')
  )
  const prizesSnap = await getDocs(prizesQ)
  
  if (prizesSnap.empty) {
    throw new Error('景品が設定されていません')
  }

  const prizes: Prize[] = prizesSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Prize))

  // 4. 抽選実行
  const wonPrize = drawLottery(prizes)

  // 5. 結果を保存
  const result: Omit<LotteryResult, 'id'> = {
    userId,
    date: today,
    slot,
    prizeId: wonPrize?.id || null,
    prizeName: wonPrize?.name || 'なし',
    prizeEmoji: wonPrize?.emoji || '❌',
    rarity: wonPrize?.rarity || 'normal',
    timestamp: new Date().toISOString()
  }

  await addDoc(collection(db, 'lotteryResults'), {
    ...result,
    _ts: serverTimestamp()
  })

  return wonPrize
}

/**
 * 抽選処理（確率ベース）
 */
function drawLottery(prizes: Prize[]): Prize | null {
  const random = Math.random() * 100 // 0-100の乱数
  let cumulative = 0

  for (const prize of prizes) {
    cumulative += prize.probability
    if (random < cumulative) {
      return prize
    }
  }

  return null
}

/**
 * 今日の抽選可能な枠を取得
 * @param userId ユーザーID
 * @returns 抽選可能な枠の配列
 */
export async function getAvailableSlots(userId: string): Promise<LotterySlot[]> {
  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-')

  const resultsQ = query(
    collection(db, 'lotteryResults'),
    where('userId', '==', userId),
    where('date', '==', today)
  )
  const resultsSnap = await getDocs(resultsQ)

  const usedSlots = new Set<LotterySlot>()
  resultsSnap.docs.forEach(doc => {
    const data = doc.data()
    usedSlots.add(data.slot)
  })

  const allSlots: LotterySlot[] = ['morning', 'lunch']
  return allSlots.filter(slot => !usedSlots.has(slot))
}

/**
 * 現在の時刻から適切な抽選枠を判定
 * @returns 抽選枠（なければnull）
 */
export function getCurrentSlot(): LotterySlot | null {
  const now = new Date()
  const hour = now.getHours()

  // 午前: 5:00-11:59
  if (hour >= 5 && hour < 12) {
    return 'morning'
  }
  // 昼食後: 12:00-23:59
  else if (hour >= 12 && hour < 24) {
    return 'lunch'
  }
  // 深夜: 0:00-4:59 → 前日の昼食扱い
  else {
    return 'lunch'
  }
}

/**
 * ユーザーの抽選履歴を取得
 */
export async function getLotteryHistory(userId: string, limit: number = 30): Promise<LotteryResult[]> {
  const q = query(
    collection(db, 'lotteryResults'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  )
  const snap = await getDocs(q)
  
  return snap.docs.slice(0, limit).map(doc => ({
    id: doc.id,
    ...doc.data()
  } as LotteryResult))
}
