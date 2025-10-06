import { useState, useRef, useEffect } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, orderBy, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { compute, nowIsoUtc, jst } from '../lib/pay'
import type { TimesheetEntry } from '../types'

export default function AdminScannerPage() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')
  const [lastScannedUser, setLastScannedUser] = useState<any>(null)
  const [mode, setMode] = useState<'auto' | 'checkin' | 'checkout'>('auto')
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  async function startScanning() {
    setScanning(true)
    setMessage('')
    setResult('')

    try {
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      if (videoDevices.length === 0) {
        throw new Error('カメラが見つかりません')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      reader.decodeFromVideoDevice(null, videoRef.current!, (result, error) => {
        if (result) {
          const text = result.getText()
          setResult(text)
          handleQRCodeScanned(text)
          stopScanning()
        }
      })
    } catch (error: any) {
      setMessageType('error')
      setMessage(`エラー: ${error.message}`)
      setScanning(false)
    }
  }

  function stopScanning() {
    if (readerRef.current) {
      readerRef.current.reset()
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }

  async function handleQRCodeScanned(qrData: string) {
    try {
      const data = JSON.parse(qrData)
      const { userId, email } = data

      if (!userId) {
        throw new Error('無効なQRコードです')
      }

      setLastScannedUser({ userId, email })

      // Check for active timesheet
      const q = query(
        collection(db, 'timesheets'),
        where('userId', '==', userId),
        where('type', '==', 'hourly'),
        where('clockOut', '==', null),
        orderBy('createdAt', 'desc'),
        limit(1)
      )
      const snap = await getDocs(q)

      if (mode === 'auto') {
        if (snap.empty) {
          // No active session -> Clock In
          await clockIn(userId)
        } else {
          // Active session -> Clock Out
          const activeDoc = snap.docs[0]
          await clockOut(userId, activeDoc.id, activeDoc.data() as any)
        }
      } else if (mode === 'checkin') {
        await clockIn(userId)
      } else if (mode === 'checkout') {
        if (snap.empty) {
          throw new Error('出勤記録が見つかりません')
        }
        const activeDoc = snap.docs[0]
        await clockOut(userId, activeDoc.id, activeDoc.data() as any)
      }

    } catch (error: any) {
      setMessageType('error')
      setMessage(`エラー: ${error.message}`)
    }
  }

  async function clockIn(userId: string) {
    const entry: TimesheetEntry = {
      userId,
      type: 'hourly',
      clockIn: nowIsoUtc(),
      clockOut: null as any,
      breaksMinutes: 0,
      hourlyRate: 1500, // デフォルト時給
      createdAt: nowIsoUtc(),
      updatedAt: nowIsoUtc()
    }
    await addDoc(collection(db, 'timesheets'), {
      ...entry,
      clockOut: null,
      _ts: serverTimestamp()
    })

    setMessageType('success')
    setMessage(`✓ 出勤しました（${jst(entry.clockIn)}）`)
  }

  async function clockOut(userId: string, docId: string, activeData: any) {
    const final = compute({
      ...activeData,
      clockOut: nowIsoUtc(),
      breaksMinutes: 0
    })
    await updateDoc(doc(db, 'timesheets', docId), {
      ...final,
      _ts: serverTimestamp()
    })

    setMessageType('success')
    setMessage(`✓ 退勤しました（勤務時間: ${Math.floor((final.workedMinutes || 0) / 60)}時間${(final.workedMinutes || 0) % 60}分、支給額: ¥${final.payJPY}）`)
  }

  return (
    <div>
      <div className="card">
        <h2>📷 QRスキャナー</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            打刻モード
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setMode('auto')}
              style={{
                flex: 1,
                background: mode === 'auto' ? '#667eea' : '#e2e8f0',
                color: mode === 'auto' ? 'white' : '#4a5568',
                padding: '8px 16px',
                fontSize: '0.9rem'
              }}
            >
              自動判定
            </button>
            <button
              onClick={() => setMode('checkin')}
              style={{
                flex: 1,
                background: mode === 'checkin' ? '#48bb78' : '#e2e8f0',
                color: mode === 'checkin' ? 'white' : '#4a5568',
                padding: '8px 16px',
                fontSize: '0.9rem'
              }}
            >
              出勤のみ
            </button>
            <button
              onClick={() => setMode('checkout')}
              style={{
                flex: 1,
                background: mode === 'checkout' ? '#f56565' : '#e2e8f0',
                color: mode === 'checkout' ? 'white' : '#4a5568',
                padding: '8px 16px',
                fontSize: '0.9rem'
              }}
            >
              退勤のみ
            </button>
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#718096' }}>
            {mode === 'auto' && '自動: 出勤記録がない場合は出勤、ある場合は退勤'}
            {mode === 'checkin' && '出勤のみ: 常に出勤として記録'}
            {mode === 'checkout' && '退勤のみ: 常に退勤として記録'}
          </div>
        </div>

        {!scanning ? (
          <button 
            onClick={startScanning}
            style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
          >
            📷 スキャン開始
          </button>
        ) : (
          <div>
            <div style={{ 
              position: 'relative',
              width: '100%',
              maxWidth: '500px',
              margin: '0 auto',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#000'
            }}>
              <video 
                ref={videoRef}
                style={{ width: '100%', display: 'block' }}
                autoPlay
                playsInline
              />
            </div>
            <button 
              onClick={stopScanning}
              style={{ 
                width: '100%', 
                padding: '16px', 
                fontSize: '1.1rem',
                marginTop: '1rem',
                background: '#f56565'
              }}
            >
              停止
            </button>
          </div>
        )}

        {message && (
          <div style={{
            marginTop: '1rem',
            padding: '16px',
            borderRadius: '8px',
            background: messageType === 'success' ? '#f0fff4' : messageType === 'error' ? '#fff5f5' : '#edf2f7',
            color: messageType === 'success' ? '#2f855a' : messageType === 'error' ? '#c53030' : '#4a5568',
            fontWeight: '500',
            border: `2px solid ${messageType === 'success' ? '#48bb78' : messageType === 'error' ? '#f56565' : '#cbd5e0'}`
          }}>
            {message}
          </div>
        )}

        {lastScannedUser && (
          <div style={{
            marginTop: '1rem',
            padding: '12px',
            background: '#edf2f7',
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            <strong>最後にスキャン:</strong> {lastScannedUser.email || lastScannedUser.userId.slice(0, 8) + '...'}
          </div>
        )}
      </div>

      <div className="card">
        <h3>💡 使い方</h3>
        <ul style={{ lineHeight: '1.8', fontSize: '0.95rem' }}>
          <li>1. 打刻モードを選択（通常は「自動判定」）</li>
          <li>2. 「スキャン開始」をクリック</li>
          <li>3. スタッフのQRコードをカメラにかざす</li>
          <li>4. 自動で打刻されます</li>
        </ul>
      </div>
    </div>
  )
}
