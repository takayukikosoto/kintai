import { useEffect, useState } from 'react'
import { collection, addDoc, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

export default function AdminRates() {
  const [title, setTitle] = useState('デフォルトレート')
  const [hourly, setHourly] = useState<number>(1500)
  const [roles, setRoles] = useState<string>('staff,operator,manager')
  const [list, setList] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'rates'))
      setList(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    })()
  }, [])

  async function save() {
    await addDoc(collection(db, 'rates'), {
      title,
      hourly,
      roles: roles.split(',').map(s => s.trim()),
      createdAt: new Date().toISOString()
    })
    alert('保存しました')
  }

  return (
    <div className="card">
      <h2>⚙️ 管理: レートプリセット</h2>
      <div className="grid">
        <label>タイトル<input value={title} onChange={e => setTitle(e.target.value)} /></label>
        <label>時給(円)<input type="number" value={hourly} onChange={e => setHourly(parseInt(e.target.value || '0'))} /></label>
        <label>対象ロールCSV<input value={roles} onChange={e => setRoles(e.target.value)} placeholder="staff,operator,manager" /></label>
        <button onClick={save}>追加</button>
      </div>
      <h3 style={{ marginTop: 24 }}>既存プリセット</h3>
      <ul>
        {list.map(x => <li key={x.id}><strong>{x.title}</strong>: ¥{x.hourly} <span style={{ color: '#718096' }}>[{x.roles?.join(', ')}]</span></li>)}
      </ul>
    </div>
  )
}
