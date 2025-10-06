import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

interface UserSettingsProps {
  userId: string
  userEmail: string
  onDefaultRateChange: (rate: number) => void
}

export default function UserSettings({ userId, userEmail, onDefaultRateChange }: UserSettingsProps) {
  const [defaultRate, setDefaultRate] = useState<number>(1500)
  const [name, setName] = useState<string>('')
  const [saved, setSaved] = useState<boolean>(false)

  useEffect(() => {
    (async () => {
      const docRef = doc(db, 'users', userId)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        setDefaultRate(data.defaultRate || 1500)
        setName(data.name || '')
        onDefaultRateChange(data.defaultRate || 1500)
      }
    })()
  }, [userId, onDefaultRateChange])

  async function save() {
    const docRef = doc(db, 'users', userId)
    await setDoc(docRef, {
      name,
      email: userEmail,
      defaultRate,
      updatedAt: new Date().toISOString()
    }, { merge: true })
    setSaved(true)
    onDefaultRateChange(defaultRate)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="card">
      <h2>👤 ユーザー設定</h2>
      <div className="grid">
        <label>
          名前
          <input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="山田太郎"
          />
        </label>
        <label>
          基本時給(円)
          <input 
            type="number" 
            value={defaultRate} 
            onChange={e => setDefaultRate(parseInt(e.target.value || '0'))} 
          />
        </label>
        <button onClick={save}>設定を保存</button>
        {saved && <div className="success-message">✓ 設定を保存しました</div>}
      </div>
    </div>
  )
}
