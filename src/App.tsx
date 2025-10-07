import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from './firebase'
import Navigation from './components/Navigation'
import HomePage from './pages/HomePage'
import MyPage from './pages/MyPage'
import AdminScannerPage from './pages/AdminScannerPage'
import AdminContinuousScannerPage from './pages/AdminContinuousScannerPage'
import AdminRatesPage from './pages/AdminRatesPage'
import AdminUsersPage from './pages/AdminUsersPage'
import { ToastContainer } from './components/Toast'
import Loading from './components/Loading'

export default function App() {
  const { user, loading, isAdmin, signInGoogle, signOut, registerEmail, signInEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [defaultRate, setDefaultRate] = useState<number>(1500)
  const [error, setError] = useState<string>('')
  const [authLoading, setAuthLoading] = useState(false)

  if (loading) return <Loading fullscreen message="認証情報を確認中..." />

  if (!user) {
    const handleSignIn = async () => {
      setError('')
      if (!email || !password) {
        setError('メールアドレスとパスワードを入力してください')
        return
      }
      if (!email.includes('@')) {
        setError('有効なメールアドレスを入力してください')
        return
      }
      setAuthLoading(true)
      try {
        await signInEmail(email, password)
      } catch (err: any) {
        setError(getErrorMessage(err.code))
      } finally {
        setAuthLoading(false)
      }
    }

    const handleRegister = async () => {
      setError('')
      if (!email || !password) {
        setError('メールアドレスとパスワードを入力してください')
        return
      }
      if (!email.includes('@')) {
        setError('有効なメールアドレスを入力してください（例: user@example.com）')
        return
      }
      if (password.length < 6) {
        setError('パスワードは6文字以上で入力してください')
        return
      }
      setAuthLoading(true)
      try {
        await registerEmail(email, password)
      } catch (err: any) {
        setError(getErrorMessage(err.code))
      } finally {
        setAuthLoading(false)
      }
    }

    const handleGoogleSignIn = async () => {
      setError('')
      setAuthLoading(true)
      try {
        await signInGoogle()
      } catch (err: any) {
        setError(getErrorMessage(err.code))
      } finally {
        setAuthLoading(false)
      }
    }

    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 style={{ color: '#667eea', marginBottom: '2rem' }}>KST 勤怠</h1>
          <div className="grid">
            <input 
              placeholder="Email (例: user@example.com)" 
              type="email"
              value={email} 
              onChange={e => {
                setEmail(e.target.value)
                setError('')
              }} 
              disabled={authLoading}
            />
            <input 
              placeholder="Password (6文字以上)" 
              type="password" 
              value={password} 
              onChange={e => {
                setPassword(e.target.value)
                setError('')
              }}
              disabled={authLoading}
            />
            {error && (
              <div style={{ 
                color: '#e53e3e', 
                background: '#fff5f5', 
                padding: '12px', 
                borderRadius: '6px',
                fontSize: '0.9rem',
                border: '1px solid #fc8181'
              }}>
                ⚠️ {error}
              </div>
            )}
            <button onClick={handleSignIn} disabled={authLoading}>
              {authLoading ? '処理中...' : 'ログイン'}
            </button>
            <button onClick={handleRegister} disabled={authLoading}>
              {authLoading ? '処理中...' : '新規登録'}
            </button>
            <button onClick={handleGoogleSignIn} disabled={authLoading}>
              {authLoading ? '処理中...' : 'Googleでログイン'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  function getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/invalid-email':
        return 'メールアドレスの形式が正しくありません'
      case 'auth/user-disabled':
        return 'このアカウントは無効化されています'
      case 'auth/user-not-found':
        return 'このメールアドレスは登録されていません'
      case 'auth/wrong-password':
        return 'パスワードが正しくありません'
      case 'auth/email-already-in-use':
        return 'このメールアドレスは既に登録されています'
      case 'auth/weak-password':
        return 'パスワードは6文字以上で入力してください'
      case 'auth/operation-not-allowed':
        return 'この認証方法は有効化されていません'
      case 'auth/popup-closed-by-user':
        return 'ログインがキャンセルされました'
      default:
        return `エラーが発生しました: ${code}`
    }
  }

  return (
    <Router>
      <div className="container">
        <Navigation userEmail={user.email || ''} isAdmin={isAdmin} onSignOut={() => signOut()} />

        <Routes>
          <Route path="/" element={<HomePage userId={user.uid} defaultRate={defaultRate} isAdmin={isAdmin} />} />
          <Route path="/mypage" element={<MyPage userId={user.uid} userEmail={user.email || ''} onDefaultRateChange={setDefaultRate} />} />
          <Route path="/admin-scanner" element={<AdminScannerPage />} />
          <Route path="/admin-continuous-scanner" element={
            isAdmin ? <AdminContinuousScannerPage /> : <div className="card"><h2>⚠️ アクセス拒否</h2><p>このページは管理者専用です</p></div>
          } />
          <Route path="/admin-users" element={
            isAdmin ? <AdminUsersPage /> : <div className="card"><h2>⚠️ アクセス拒否</h2><p>このページは管理者専用です</p></div>
          } />
          <Route path="/admin-rates" element={
            isAdmin ? <AdminRatesPage /> : <div className="card"><h2>⚠️ アクセス拒否</h2><p>このページは管理者専用です</p></div>
          } />
        </Routes>
      </div>
      <ToastContainer />
    </Router>
  )
}
