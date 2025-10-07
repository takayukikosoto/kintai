import { useState, useEffect } from 'react'
import type { Prize } from '../types'

interface LotteryModalProps {
  prize: Prize | null
  onClose: () => void
}

export default function LotteryModal({ prize, onClose }: LotteryModalProps) {
  const [phase, setPhase] = useState<'spinning' | 'opening' | 'result'>('spinning')

  useEffect(() => {
    // アニメーションシーケンス
    const timer1 = setTimeout(() => setPhase('opening'), 2000)
    const timer2 = setTimeout(() => setPhase('result'), 2500)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  const isSSR = prize?.rarity === 'ssr'
  const isLose = prize?.name === 'ハズレ（ティッシュ1個）'

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20000,
        animation: 'fadeIn 0.3s ease'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && phase === 'result') {
          onClose()
        }
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '24px',
          padding: '48px',
          minWidth: '400px',
          maxWidth: '600px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          position: 'relative'
        }}
      >
        {/* スピニングフェーズ */}
        {phase === 'spinning' && (
          <div>
            <div style={{
              fontSize: '6rem',
              animation: 'spin 1s linear infinite',
              marginBottom: '24px'
            }}>
              🎰
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#4a5568'
            }}>
              抽選中...
            </div>
            <div style={{
              marginTop: '16px',
              height: '4px',
              background: '#e2e8f0',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                animation: 'loading 1.5s ease-in-out infinite',
                width: '50%'
              }} />
            </div>
          </div>
        )}

        {/* オープニングフェーズ */}
        {phase === 'opening' && (
          <div>
            <div style={{
              fontSize: '8rem',
              animation: 'bounce 0.5s ease',
              marginBottom: '24px'
            }}>
              💥
            </div>
          </div>
        )}

        {/* 結果フェーズ */}
        {phase === 'result' && prize && (
          <div style={{ animation: 'scaleIn 0.5s ease' }}>
            {/* SSRエフェクト */}
            {isSSR && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, #ffd700, #ffed4e, #ffd700)',
                opacity: 0.2,
                animation: 'pulse 2s ease-in-out infinite',
                borderRadius: '24px',
                pointerEvents: 'none'
              }} />
            )}

            <div style={{
              fontSize: '3rem',
              marginBottom: '16px',
              fontWeight: '700',
              color: isSSR ? '#ffd700' : isLose ? '#718096' : '#48bb78'
            }}>
              {isSSR ? '🎊 SSR！ 🎊' : isLose ? '😅 残念...' : '🎉 当たり！ 🎉'}
            </div>

            <div style={{
              fontSize: '8rem',
              marginBottom: '24px',
              animation: isSSR ? 'rainbow 2s linear infinite' : 'none',
              textShadow: isSSR ? '0 0 20px rgba(255, 215, 0, 0.8)' : 'none'
            }}>
              {prize.emoji}
            </div>

            <div style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#2d3748',
              marginBottom: '16px'
            }}>
              {prize.name}
            </div>

            {isSSR && (
              <div style={{
                fontSize: '1.2rem',
                color: '#ffd700',
                fontWeight: '600',
                marginBottom: '16px',
                animation: 'pulse 1s ease-in-out infinite'
              }}>
                ✨ 超激レア！ ✨
              </div>
            )}

            <button
              onClick={onClose}
              style={{
                marginTop: '32px',
                padding: '16px 48px',
                fontSize: '1.2rem',
                fontWeight: '600',
                background: isSSR 
                  ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: isSSR ? '#7c3aed' : 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              閉じる
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.5);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        
        @keyframes rainbow {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
