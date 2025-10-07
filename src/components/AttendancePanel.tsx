import { useState } from 'react'
import ClockCard from './ClockCard'
import FieldJobForm from './FieldJobForm'

interface AttendancePanelProps {
  userId: string
  defaultRate: number
}

export default function AttendancePanel({ userId, defaultRate }: AttendancePanelProps) {
  const [activeTab, setActiveTab] = useState<'hourly' | 'field'>('hourly')

  return (
    <div className="card">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>📝 打刻・申請</h2>
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          background: '#f7fafc',
          padding: '4px',
          borderRadius: '10px'
        }}>
          <button
            onClick={() => setActiveTab('hourly')}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: activeTab === 'hourly' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
              color: activeTab === 'hourly' ? 'white' : '#4a5568',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'hourly' ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
            }}
          >
            ⏰ 時給打刻
          </button>
          <button
            onClick={() => setActiveTab('field')}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: activeTab === 'field' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'transparent',
              color: activeTab === 'field' ? 'white' : '#4a5568',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === 'field' ? '0 4px 12px rgba(245, 87, 108, 0.3)' : 'none'
            }}
          >
            🏗️ 現場申請
          </button>
        </div>
      </div>

      <div style={{ 
        animation: 'fadeIn 0.3s ease-in',
      }}>
        {activeTab === 'hourly' ? (
          <div>
            <div style={{ 
              background: 'linear-gradient(135deg, #e0e7ff 0%, #e9d5ff 100%)',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              color: '#5b21b6'
            }}>
              💡 <strong>時給打刻モード</strong>：出勤・退勤を打刻して、勤務時間に応じた給与を計算します
            </div>
            <ClockCard userId={userId} defaultRate={defaultRate} hideTitle />
          </div>
        ) : (
          <div>
            <div style={{ 
              background: 'linear-gradient(135deg, #fee2e2 0%, #fce7f3 100%)',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              color: '#be123c'
            }}>
              💡 <strong>現場申請モード</strong>：定額制の現場勤務を申請します（日当・交通費・手当）
            </div>
            <FieldJobForm userId={userId} hideTitle />
          </div>
        )}
      </div>
    </div>
  )
}
