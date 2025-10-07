import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { showToast } from '../components/Toast'
import type { Prize, LotteryRarity } from '../types'

export default function AdminLotteryPage() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Prize | null>(null)
  const [showForm, setShowForm] = useState(false)

  // フォーム用state
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [probability, setProbability] = useState<number>(10)
  const [rarity, setRarity] = useState<LotteryRarity>('normal')

  useEffect(() => {
    loadPrizes()
  }, [])

  async function loadPrizes() {
    try {
      const q = query(collection(db, 'prizes'), orderBy('order', 'asc'))
      const snap = await getDocs(q)
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Prize))
      setPrizes(list)
    } catch (error) {
      console.error('景品読み込みエラー:', error)
      showToast('景品の読み込みに失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  function openAddForm() {
    setEditing(null)
    setName('')
    setEmoji('')
    setProbability(10)
    setRarity('normal')
    setShowForm(true)
  }

  function openEditForm(prize: Prize) {
    setEditing(prize)
    setName(prize.name)
    setEmoji(prize.emoji)
    setProbability(prize.probability)
    setRarity(prize.rarity)
    setShowForm(true)
  }

  async function savePrize() {
    if (!name.trim() || !emoji.trim()) {
      showToast('名前と絵文字を入力してください', 'warning')
      return
    }

    if (probability < 0 || probability > 100) {
      showToast('確率は0〜100の範囲で入力してください', 'warning')
      return
    }

    try {
      const prizeData = {
        name,
        emoji,
        probability,
        rarity,
        enabled: true,
        updatedAt: new Date().toISOString()
      }

      if (editing?.id) {
        // 更新
        await updateDoc(doc(db, 'prizes', editing.id), {
          ...prizeData,
          _ts: serverTimestamp()
        })
        showToast('景品を更新しました', 'success')
      } else {
        // 新規追加
        await addDoc(collection(db, 'prizes'), {
          ...prizeData,
          order: prizes.length,
          createdAt: new Date().toISOString(),
          _ts: serverTimestamp()
        })
        showToast('景品を追加しました', 'success')
      }

      setShowForm(false)
      loadPrizes()
    } catch (error) {
      console.error('保存エラー:', error)
      showToast('保存に失敗しました', 'error')
    }
  }

  async function deletePrize(prize: Prize) {
    if (!confirm(`「${prize.name}」を削除しますか？`)) return

    try {
      await deleteDoc(doc(db, 'prizes', prize.id!))
      showToast('景品を削除しました', 'success')
      loadPrizes()
    } catch (error) {
      console.error('削除エラー:', error)
      showToast('削除に失敗しました', 'error')
    }
  }

  async function toggleEnabled(prize: Prize) {
    try {
      await updateDoc(doc(db, 'prizes', prize.id!), {
        enabled: !prize.enabled,
        _ts: serverTimestamp()
      })
      loadPrizes()
    } catch (error) {
      console.error('更新エラー:', error)
    }
  }

  const totalProbability = prizes.reduce((sum, p) => sum + (p.enabled ? p.probability : 0), 0)

  if (loading) return <div className="card">読み込み中...</div>

  return (
    <div>
      <div className="card">
        <h2>🎰 抽選設定</h2>
        <p style={{ color: '#718096', marginBottom: '1rem' }}>
          景品と確率を設定します。合計確率は100%を目安にしてください。
        </p>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          padding: '16px',
          background: totalProbability === 100 ? '#d1fae5' : '#fef3c7',
          borderRadius: '8px'
        }}>
          <div>
            <strong>合計確率:</strong> {totalProbability.toFixed(2)}%
          </div>
          <button
            onClick={openAddForm}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '1rem'
            }}
          >
            + 新しい景品を追加
          </button>
        </div>

        {prizes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            color: '#718096'
          }}>
            景品が登録されていません。<br />
            まずは景品を追加してください。
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {prizes.map(prize => (
              <div
                key={prize.id}
                style={{
                  padding: '16px',
                  background: prize.enabled ? 'white' : '#f7fafc',
                  border: `2px solid ${prize.rarity === 'ssr' ? '#ffd700' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  opacity: prize.enabled ? 1 : 0.6
                }}
              >
                <div style={{ fontSize: '3rem' }}>{prize.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    {prize.name}
                    {prize.rarity === 'ssr' && (
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 8px',
                        background: '#ffd700',
                        color: '#7c3aed',
                        fontSize: '0.75rem',
                        borderRadius: '4px',
                        fontWeight: '700'
                      }}>
                        SSR
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#718096' }}>
                    確率: <strong>{prize.probability}%</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => toggleEnabled(prize)}
                    style={{
                      padding: '8px 16px',
                      background: prize.enabled ? '#48bb78' : '#cbd5e0',
                      color: 'white',
                      fontSize: '0.9rem'
                    }}
                  >
                    {prize.enabled ? '有効' : '無効'}
                  </button>
                  <button
                    onClick={() => openEditForm(prize)}
                    style={{
                      padding: '8px 16px',
                      background: '#4299e1',
                      color: 'white',
                      fontSize: '0.9rem'
                    }}
                  >
                    編集
                  </button>
                  <button
                    onClick={() => deletePrize(prize)}
                    style={{
                      padding: '8px 16px',
                      background: '#f56565',
                      color: 'white',
                      fontSize: '0.9rem'
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* フォームモーダル */}
      {showForm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false)
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <h3>{editing ? '景品を編集' : '景品を追加'}</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                景品名
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: ウィダーインゼリー"
                style={{ width: '100%', padding: '10px', fontSize: '1rem' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                絵文字
              </label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="例: 🥤"
                style={{ width: '100%', padding: '10px', fontSize: '2rem', textAlign: 'center' }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                確率 (%)
              </label>
              <input
                type="number"
                value={probability}
                onChange={(e) => setProbability(Number(e.target.value))}
                min="0"
                max="100"
                step="0.01"
                style={{ width: '100%', padding: '10px', fontSize: '1rem' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                レアリティ
              </label>
              <select
                value={rarity}
                onChange={(e) => setRarity(e.target.value as LotteryRarity)}
                style={{ width: '100%', padding: '10px', fontSize: '1rem' }}
              >
                <option value="normal">通常</option>
                <option value="ssr">SSR（超激レア）</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={savePrize}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontSize: '1rem'
                }}
              >
                {editing ? '更新' : '追加'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#cbd5e0',
                  color: '#2d3748',
                  fontSize: '1rem'
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
