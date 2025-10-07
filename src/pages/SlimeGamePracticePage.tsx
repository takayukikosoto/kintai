import { useState } from 'react'
import SlimeShooterV2 from '../components/SlimeShooterV2'

export default function SlimeGamePracticePage() {
  const [showGame, setShowGame] = useState(false)
  const [gameMode, setGameMode] = useState<'practice' | 'infinite'>('practice')
  const [lastScore, setLastScore] = useState<number | null>(null)

  function handleGameEnd(score: number) {
    setLastScore(score)
    setShowGame(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#1a202c',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          🎮 昼食ゲーム練習場
        </h1>
        
        <div style={{
          background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          border: '2px solid #667eea30'
        }}>
          <h2 style={{
            fontSize: '1.3rem',
            fontWeight: '700',
            color: '#667eea',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            📖 昼食ゲームとは？
          </h2>
          <p style={{
            color: '#4a5568',
            lineHeight: '1.8',
            marginBottom: '1rem'
          }}>
            出勤後、12:00以降に1日1回だけプレイできる特別なゲームです。
            武器を選んで飛ばし、画面上のターゲットを狙ってスコアを稼ぎましょう！
            高得点を獲得すると豪華な報酬がもらえます。
          </p>
          <div style={{
            background: '#fef5e7',
            padding: '1rem',
            borderRadius: '8px',
            border: '2px solid #f39c12'
          }}>
            <strong style={{ color: '#f39c12' }}>💡 練習モード</strong>
            <p style={{ color: '#4a5568', marginTop: '0.5rem', marginBottom: 0 }}>
              このページでは制限なく何度でも練習できます。スコアは記録されず、報酬もありませんが、
              戦略を練ったり、武器の特性を試すのに最適です！
            </p>
          </div>
        </div>

        {lastScore !== null && (
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
              前回のスコア
            </div>
            <div style={{ fontSize: '3rem', fontWeight: '700' }}>
              {lastScore.toLocaleString()}
            </div>
          </div>
        )}

        {/* モード選択 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => setGameMode('practice')}
            style={{
              padding: '1.2rem',
              background: gameMode === 'practice' 
                ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)'
                : '#f7fafc',
              color: gameMode === 'practice' ? 'white' : '#4a5568',
              border: gameMode === 'practice' ? 'none' : '2px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: gameMode === 'practice' 
                ? '0 4px 12px rgba(72, 187, 120, 0.3)'
                : 'none'
            }}
          >
            🎯 昼食練習モード
          </button>
          <button
            onClick={() => setGameMode('infinite')}
            style={{
              padding: '1.2rem',
              background: gameMode === 'infinite' 
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : '#f7fafc',
              color: gameMode === 'infinite' ? 'white' : '#4a5568',
              border: gameMode === 'infinite' ? 'none' : '2px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: gameMode === 'infinite' 
                ? '0 4px 12px rgba(245, 158, 11, 0.3)'
                : 'none'
            }}
          >
            🔄 無限昼食モード
          </button>
        </div>

        {/* モード説明 */}
        <div style={{
          padding: '1rem',
          background: gameMode === 'practice' ? '#f0fff4' : '#fff7ed',
          borderRadius: '8px',
          border: `2px solid ${gameMode === 'practice' ? '#48bb78' : '#f59e0b'}`,
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          lineHeight: '1.6'
        }}>
          {gameMode === 'practice' ? (
            <>
              <strong style={{ color: '#2f855a' }}>🎯 昼食練習モード</strong>
              <p style={{ marginTop: '0.5rem', marginBottom: 0, color: '#4a5568' }}>
                本番と同じルールで3回発射。武器の特性やコンボのコツを掴もう！
              </p>
            </>
          ) : (
            <>
              <strong style={{ color: '#c05621' }}>🔄 無限昼食モード</strong>
              <p style={{ marginTop: '0.5rem', marginBottom: 0, color: '#4a5568' }}>
                壁で跳ね返り続ける！ピンボール感覚で延々と楽しめる無限モード。回数制限なし！
              </p>
            </>
          )}
        </div>

        <button
          onClick={() => setShowGame(true)}
          style={{
            width: '100%',
            padding: '1.5rem',
            background: gameMode === 'practice'
              ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)'
              : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1.5rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            boxShadow: gameMode === 'practice'
              ? '0 4px 15px rgba(72, 187, 120, 0.4)'
              : '0 4px 15px rgba(245, 158, 11, 0.4)'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          {gameMode === 'practice' ? '🎯 練習スタート' : '🔄 無限モードスタート'}
        </button>

        {/* 遊び方 */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: '#f0fff4',
          borderRadius: '12px',
          border: '2px solid #48bb78'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', color: '#2f855a' }}>
            🎯 遊び方
          </h3>
          <ol style={{ color: '#4a5568', lineHeight: '2', paddingLeft: '1.5rem' }}>
            <li><strong>武器を選ぶ</strong>: 画面上部のボタンから「スライム」「矢」「円月輪」のいずれかを選択</li>
            <li><strong>引っ張る</strong>: 画面下部の武器をタップ（クリック）してドラッグ</li>
            <li><strong>狙いを定める</strong>: 引っ張る方向と強さで飛ぶ方向が決まる</li>
            <li><strong>発射</strong>: 指を離すと武器が飛んでいく</li>
            <li><strong>ターゲットに命中</strong>: 画面上の絵文字に当てるとスコアゲット！</li>
            <li><strong>3回挑戦</strong>: 合計3回発射してハイスコアを目指そう</li>
          </ol>
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: 'white',
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            <strong style={{ color: '#2f855a' }}>💡 コンボシステム</strong>
            <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
              1秒以内に連続でターゲットに当てると<strong>コンボ</strong>が発動！
              コンボ数に応じてスコアが倍増します（最大2倍）
            </p>
          </div>
        </div>

        {/* 武器の特徴 */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: '#fffaf0',
          borderRadius: '12px',
          border: '2px solid #ed8936'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', color: '#c05621' }}>
            ⚔️ 武器の特徴と使い分け
          </h3>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '8px',
              border: '2px solid #60a5fa'
            }}>
              <h4 style={{ color: '#3b82f6', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                💧 スライム（バランス型）
              </h4>
              <div style={{ color: '#4a5568', fontSize: '0.9rem', lineHeight: '1.7' }}>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>特徴</strong>: 通常の重力と空気抵抗で飛ぶバランス型。ぷるぷる変形するビジュアルが特徴。
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>おすすめ</strong>: 初心者向け。安定した軌道で予測しやすい。
                </p>
                <p style={{ marginBottom: 0 }}>
                  <strong>攻略</strong>: 中距離のターゲット狙いに最適。放物線を意識して狙おう。
                </p>
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '8px',
              border: '2px solid #fbbf24'
            }}>
              <h4 style={{ color: '#f59e0b', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                🏹 矢（スピード型）
              </h4>
              <div style={{ color: '#4a5568', fontSize: '0.9rem', lineHeight: '1.7' }}>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>特徴</strong>: 1.8倍の速度！重力の影響が少なく、ほぼ直線的に飛ぶ。
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>おすすめ</strong>: 遠距離狙い、素早い判断が得意な人向け。
                </p>
                <p style={{ marginBottom: 0 }}>
                  <strong>攻略</strong>: 上部の高得点ターゲットを貫通感覚で狙える。コンボが稼ぎやすい。
                </p>
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '8px',
              border: '2px solid #a78bfa'
            }}>
              <h4 style={{ color: '#8b5cf6', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                ⭕ 円月輪（テクニカル型）
              </h4>
              <div style={{ color: '#4a5568', fontSize: '0.9rem', lineHeight: '1.7' }}>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>特徴</strong>: ゆっくり回転しながら飛び、一定時間後に戻ってくる。滞空時間が長い。
                </p>
                <p style={{ marginBottom: '0.5rem' }}>
                  <strong>おすすめ</strong>: 上級者向け。1回の発射で複数ターゲットを狙える。
                </p>
                <p style={{ marginBottom: 0 }}>
                  <strong>攻略</strong>: ターゲットの密集地帯を狙うと効果的。戻る軌道も利用してコンボを繋げよう。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 報酬・特典 */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #fef5e7 0%, #ffeaa7 100%)',
          borderRadius: '12px',
          border: '2px solid #f39c12'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', color: '#d68910' }}>
            🎁 報酬・特典（本番ゲームのみ）
          </h3>
          <div style={{ color: '#4a5568', lineHeight: '1.8' }}>
            <p style={{ marginBottom: '1rem', fontWeight: '600' }}>
              獲得したスコアに応じて以下の報酬がもらえます：
            </p>
            <div style={{
              display: 'grid',
              gap: '0.8rem',
              background: 'white',
              padding: '1rem',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: '#fff9e6', borderRadius: '6px' }}>
                <span><strong>🎮 ゲームソフト抽選券</strong></span>
                <span style={{ fontWeight: '700', color: '#d68910' }}>60,000点以上</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: '#f0f9ff', borderRadius: '6px' }}>
                <span><strong>🥤 ウィダーインゼリー</strong></span>
                <span style={{ fontWeight: '700', color: '#3b82f6' }}>40,000点以上</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: '#f0fdfa', borderRadius: '6px' }}>
                <span><strong>💧 ミネラルウォーター</strong></span>
                <span style={{ fontWeight: '700', color: '#14b8a6' }}>25,000点以上</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: '#fef2f2', borderRadius: '6px' }}>
                <span><strong>🍘 駄菓子</strong></span>
                <span style={{ fontWeight: '700', color: '#ef4444' }}>15,000点以上</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: '#f9fafb', borderRadius: '6px' }}>
                <span><strong>🧻 ティッシュ1個</strong></span>
                <span style={{ fontWeight: '700', color: '#6b7280' }}>0～14,999点</span>
              </div>
            </div>
          </div>
        </div>

        {/* 攻略法 */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: '#f5f3ff',
          borderRadius: '12px',
          border: '2px solid #8b5cf6'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1rem', color: '#6d28d9' }}>
            🧠 攻略法・高得点のコツ
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
              <h4 style={{ color: '#6d28d9', marginBottom: '0.5rem' }}>
                💎 高得点ターゲットを優先
              </h4>
              <p style={{ color: '#4a5568', fontSize: '0.9rem', marginBottom: 0 }}>
                ⭐50点、💰100点、💎200点の3種類。光るオーラがある💎(200点)を積極的に狙おう。
              </p>
            </div>

            <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
              <h4 style={{ color: '#6d28d9', marginBottom: '0.5rem' }}>
                🔥 コンボを繋げる
              </h4>
              <p style={{ color: '#4a5568', fontSize: '0.9rem', marginBottom: 0 }}>
                1秒以内に連続ヒットでコンボ発動。矢や円月輪で複数ターゲットを狙うとコンボが繋がりやすい。
              </p>
            </div>

            <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
              <h4 style={{ color: '#6d28d9', marginBottom: '0.5rem' }}>
                ⏱️ ターゲットは1秒で復活
              </h4>
              <p style={{ color: '#4a5568', fontSize: '0.9rem', marginBottom: 0 }}>
                当たったターゲットは1秒後に復活！円月輪の戻り軌道で同じターゲットに再度当てることも可能。
              </p>
            </div>

            <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
              <h4 style={{ color: '#6d28d9', marginBottom: '0.5rem' }}>
                🎯 密集地帯を狙う
              </h4>
              <p style={{ color: '#4a5568', fontSize: '0.9rem', marginBottom: 0 }}>
                90個のターゲットが画面に配置されている。密集している場所を狙えば1発で複数ヒット可能。
              </p>
            </div>

            <div style={{ background: 'white', padding: '1rem', borderRadius: '8px' }}>
              <h4 style={{ color: '#6d28d9', marginBottom: '0.5rem' }}>
                🔄 武器を使い分ける
              </h4>
              <p style={{ color: '#4a5568', fontSize: '0.9rem', marginBottom: 0 }}>
                1回目：矢で遠距離を狙う → 2回目：円月輪で密集地帯 → 3回目：スライムで仕上げ、など戦略的に。
              </p>
            </div>

            <div style={{ background: '#fef5e7', padding: '1rem', borderRadius: '8px', border: '2px solid #f39c12' }}>
              <h4 style={{ color: '#d68910', marginBottom: '0.5rem' }}>
                ⚡ 最強コンボ例
              </h4>
              <p style={{ color: '#4a5568', fontSize: '0.9rem', marginBottom: 0 }}>
                円月輪で画面中央の密集地帯を狙う → 行きと戻りで💎を複数ヒット → コンボ×5以上で10,000点超え！
              </p>
            </div>
          </div>
        </div>

        <a
          href="/"
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: '2rem',
            color: '#667eea',
            textDecoration: 'none',
            fontWeight: '600'
          }}
        >
          ← ホームに戻る
        </a>
      </div>

      {showGame && (
        <SlimeShooterV2
          onGameEnd={handleGameEnd}
          onClose={() => setShowGame(false)}
          mode={gameMode}
        />
      )}
    </div>
  )
}
