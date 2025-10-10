import { Link, useLocation } from 'react-router-dom'

interface NavigationProps {
  userEmail: string
  isAdmin: boolean
  onSignOut: () => void
}

export default function Navigation({ userEmail, isAdmin, onSignOut }: NavigationProps) {
  const location = useLocation()

  const navItems = [
    { path: '/', label: '🏠 ホーム', icon: '🏠', adminOnly: false },
    { path: '/mypage', label: '👤 マイページ', icon: '👤', adminOnly: false },
    { path: '/slime-practice', label: '🎮 昼食ゲーム練習', icon: '🎮', adminOnly: false },
    { path: '/shooting-practice', label: '🚀 シューティング練習', icon: '🚀', adminOnly: false },
    { path: '/admin-scanner', label: '📷 QRスキャナー', icon: '📷', adminOnly: false },
    { path: '/admin-continuous-scanner', label: '📹 連続スキャン', icon: '📹', adminOnly: true },
    { path: '/admin-lottery', label: '🎰 抽選設定', icon: '🎰', adminOnly: true },
    { path: '/admin-users', label: '👥 ユーザー管理', icon: '👥', adminOnly: true },
    { path: '/admin-rates', label: '⚙️ 管理設定', icon: '⚙️', adminOnly: true },
  ]

  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <header className="header" style={{ flexWrap: 'wrap' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>KST 勤怠</h1>
      <div className="user-email" style={{ marginBottom: '0.5rem' }}>{userEmail}</div>
      <button onClick={onSignOut}>ログアウト</button>
      
      <nav style={{ 
        width: '100%', 
        marginTop: '1rem',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {visibleNavItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '0.95rem',
              background: location.pathname === item.path 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : '#f7fafc',
              color: location.pathname === item.path ? 'white' : '#4a5568',
              transition: 'all 0.2s ease',
              boxShadow: location.pathname === item.path 
                ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                : 'none'
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
