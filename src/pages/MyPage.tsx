import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import UserSettings from '../components/UserSettings'

interface MyPageProps {
  userId: string
  userEmail: string
  onDefaultRateChange: (rate: number) => void
}

export default function MyPage({ userId, userEmail, onDefaultRateChange }: MyPageProps) {
  const [qrData, setQrData] = useState<string>('')

  useEffect(() => {
    // QRコードのデータ: ユーザーIDとタイムスタンプ
    const data = JSON.stringify({
      userId,
      email: userEmail,
      timestamp: Date.now()
    })
    setQrData(data)
  }, [userId, userEmail])

  return (
    <div>
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>📱 マイQRコード</h2>
        <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
          管理者端末でこのQRコードをスキャンして打刻できます
        </p>
        
        <div style={{ 
          display: 'inline-block',
          padding: '24px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {qrData && (
            <QRCodeSVG 
              value={qrData}
              size={256}
              level="H"
              includeMargin={true}
            />
          )}
        </div>

        <div style={{ 
          marginTop: '1.5rem',
          padding: '12px',
          background: '#edf2f7',
          borderRadius: '8px',
          fontSize: '0.9rem'
        }}>
          <strong>ユーザーID:</strong> {userId.slice(0, 8)}...
        </div>
      </div>

      <UserSettings userId={userId} userEmail={userEmail} onDefaultRateChange={onDefaultRateChange} />

      <div className="card">
        <h2>ℹ️ 使い方</h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li>✓ 上のQRコードを管理者端末でスキャンすると打刻できます</li>
          <li>✓ 基本時給を設定すると、毎回の入力が不要になります</li>
          <li>✓ 名前を設定すると、管理画面で識別しやすくなります</li>
        </ul>
      </div>
    </div>
  )
}
