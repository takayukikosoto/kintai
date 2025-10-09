import { useState, useRef, useEffect } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, orderBy, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { compute, nowIsoUtc, jst } from '../lib/pay'
import { showToast } from '../components/Toast'
import { executeLottery, getCurrentSlot } from '../lib/lottery'
import LotteryModal from '../components/LotteryModal'
import type { TimesheetEntry, Prize } from '../types'

interface ScanLog {
  id: string
  timestamp: string
  userId: string
  email: string
  action: 'checkin' | 'checkout'
  success: boolean
}

export default function AdminContinuousScannerPage() {
  const [scanning, setScanning] = useState(false)
  const [logs, setLogs] = useState<ScanLog[]>([])
  const [lotteryPrize, setLotteryPrize] = useState<Prize | null>(null)
  const [showLottery, setShowLottery] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const lastScanRef = useRef<string>('')
  const lastScanTimeRef = useRef<number>(0)

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  async function startScanning() {
    setScanning(true)

    try {
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      // モバイル対応: まずカメラアクセス権限を取得
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      if (videoDevices.length === 0) {
        showToast('カメラが見つかりません', 'error')
        setScanning(false)
        return
      }

      // カメラストリームを取得（モバイルでは背面カメラを優先）
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // 連続スキャンモード（deviceId=nullでストリームから読み取り）
      reader.decodeFromVideoDevice(null, videoRef.current!, async (result, err) => {
        if (result) {
          const now = Date.now()
          const scannedText = result.getText()
          
          // 同じQRコードを3秒以内に再度読まないようにする
          if (scannedText === lastScanRef.current && now - lastScanTimeRef.current < 3000) {
            return
          }

          lastScanRef.current = scannedText
          lastScanTimeRef.current = now

          // QRコードを処理
          await handleScan(scannedText)
        }
      })

    } catch (error: any) {
      console.error('カメラ起動エラー:', error)
      showToast(`カメラエラー: ${error.message}`, 'error')
      setScanning(false)
    }
  }

  function stopScanning() {
    if (readerRef.current) {
      readerRef.current.reset()
      readerRef.current = null
    }
    // ストリームを停止
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }

  async function handleScan(qrData: string) {
    try {
      const data = JSON.parse(qrData)
      const userId = data.userId
      const userEmail = data.email || 'unknown'

      // 既存の出勤記録をチェック
      const q = query(
        collection(db, 'timesheets'),
        where('userId', '==', userId),
        where('type', '==', 'hourly'),
        where('clockOut', '==', null),
        orderBy('createdAt', 'desc'),
        limit(1)
      )
      const snap = await getDocs(q)

      let action: 'checkin' | 'checkout'
      let success = true

      if (snap.empty) {
        // 出勤記録がない → 出勤
        await clockIn(userId)
        action = 'checkin'
        showToast(`✓ 出勤: ${userEmail}`, 'success')

        // 抽選を実行
        try {
          const slot = getCurrentSlot()
          if (slot) {
            const prize = await executeLottery(userId, slot)
            if (prize) {
              // 抽選に当たった！
              setLotteryPrize(prize)
              setShowLottery(true)
            }
          }
        } catch (error: any) {
          console.error('抽選エラー:', error)
          // 抽選エラーは無視（出勤処理は成功）
        }
      } else {
        // 出勤記録がある → 退勤
        const activeDoc = snap.docs[0]
        const payAmount = await clockOut(userId, activeDoc.id, activeDoc.data() as any)
        action = 'checkout'
        showToast(`✓ 退勤: ${userEmail} (¥${payAmount?.toLocaleString()})`, 'success')
      }

      // ログに追加
      const log: ScanLog = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString('ja-JP'),
        userId,
        email: userEmail,
        action,
        success
      }
      setLogs(prev => [log, ...prev].slice(0, 20)) // 最新20件を保持

    } catch (error: any) {
      console.error('スキャンエラー:', error)
      showToast(`エラー: ${error.message}`, 'error')
      
      const log: ScanLog = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString('ja-JP'),
        userId: 'error',
        email: 'エラー',
        action: 'checkin',
        success: false
      }
      setLogs(prev => [log, ...prev].slice(0, 20))
    }
  }

  async function clockIn(userId: string) {
    const entry: TimesheetEntry = {
      userId,
      type: 'hourly',
      clockIn: nowIsoUtc(),
      clockOut: null as any,
      breaksMinutes: 0,
      hourlyRate: 1500,
      createdAt: nowIsoUtc(),
      updatedAt: nowIsoUtc()
    }
    await addDoc(collection(db, 'timesheets'), {
      ...entry,
      clockOut: null,
      _ts: serverTimestamp()
    })
  }

  async function clockOut(userId: string, docId: string, activeEntry: any): Promise<number> {
    const final = compute({
      ...activeEntry,
      clockOut: nowIsoUtc(),
      breaksMinutes: 0
    })
    
    await updateDoc(doc(db, 'timesheets', docId), {
      ...final,
      _ts: serverTimestamp()
    })

    return final.payJPY || 0
  }

  return (
    <div>
      <div className="card">
        <h2>📹 連続QRスキャナー（管理者専用）</h2>
        <p style={{ color: '#718096', marginBottom: '1rem', fontSize: '0.9rem' }}>
          カメラが常時起動し、QRコードを自動的に読み取ります
        </p>

        {!scanning ? (
          <button 
            onClick={startScanning}
            style={{ 
              width: '100%', 
              padding: '16px', 
              fontSize: '1.1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            📹 スキャン開始
          </button>
        ) : (
          <div>
            <video
              ref={videoRef}
              style={{
                width: '100%',
                maxWidth: '600px',
                borderRadius: '12px',
                border: '4px solid #667eea',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                display: 'block',
                margin: '0 auto 1rem'
              }}
            />
            <button 
              onClick={stopScanning}
              style={{ 
                width: '100%', 
                padding: '12px',
                background: '#f56565'
              }}
            >
              ⏹ 停止
            </button>
          </div>
        )}
      </div>

      {/* スキャンログ */}
      {logs.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>📋 スキャン履歴</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {logs.map(log => (
              <div
                key={log.id}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  borderRadius: '8px',
                  background: log.success 
                    ? (log.action === 'checkin' ? '#e6fffa' : '#fff5f5')
                    : '#fed7d7',
                  borderLeft: `4px solid ${
                    log.success 
                      ? (log.action === 'checkin' ? '#38b2ac' : '#f56565')
                      : '#e53e3e'
                  }`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.9rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {log.action === 'checkin' ? '🟢 出勤' : '🔴 退勤'}: {log.email}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                    {log.timestamp}
                  </div>
                </div>
                {log.success ? (
                  <span style={{ fontSize: '1.2rem' }}>✓</span>
                ) : (
                  <span style={{ fontSize: '1.2rem' }}>✕</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 抽選モーダル */}
      {showLottery && lotteryPrize && (
        <LotteryModal
          prize={lotteryPrize}
          onClose={() => {
            setShowLottery(false)
            setLotteryPrize(null)
          }}
        />
      )}
    </div>
  )
}
