import AdminRates from '../components/AdminRates'

export default function AdminRatesPage() {
  return (
    <div>
      <AdminRates />
      
      <div className="card">
        <h3>ℹ️ 管理設定について</h3>
        <ul style={{ lineHeight: '1.8', fontSize: '0.95rem' }}>
          <li>✓ レートプリセット: よく使う時給を登録できます</li>
          <li>✓ 対象ロール: どの役職に適用するかを設定できます</li>
          <li>✓ 管理者権限が必要な機能です</li>
        </ul>
      </div>
    </div>
  )
}
