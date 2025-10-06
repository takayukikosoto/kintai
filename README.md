# KST Attendance (Firebase Prototype)

React + Vite + Firebase (Auth & Firestore) で最速プロト。
- Email/Password or Google でログイン
- 時給打刻（出勤/退勤、休憩、時給）
- 現場（定額+交通費+手当）申請フォーム
- 管理用：レートプリセット（要 admin claim）
- すべてUTC保存・JST表示

## セットアップ

```bash
pnpm i # または npm i / yarn
cp .env.example .env
# .env を Firebase 設定で埋める
```

### Firebase
1. Firebase Console で Project 作成
2. Authentication: Email/Password と Google を有効化
3. Firestore: モードは Production 推奨
4. `firestore.rules` をデプロイ
5. （任意）Functions を使う場合は `firebase init functions` して `functions/` をベースに

### 開発
```bash
npm run dev
```

### 管理者権限
Firestore ルールは `request.auth.token.admin == true` を admin として判定。  
Functions または Admin SDK で Custom Claims を付与。

### 構成
- `/src/components/ClockCard.tsx` … 時給打刻
- `/src/components/FieldJobForm.tsx` … 現場フォーム（定額）
- `/src/components/AdminRates.tsx` … レートプリセット
- `/src/lib/pay.ts` … 支給額計算（JST表示ヘルパ）

### データモデル（Firestore）
- `users/{uid}`: プロフィール/ロール等（任意）
- `rates/{rateId}`: { title, hourly, roles[] }
- `timesheets/{id}`: 以下（タイプごとに使用）
  - 共通: userId, type('hourly'|'field'), clockIn, clockOut?, breaksMinutes?, createdAt, updatedAt
  - hourly: hourlyRate, workedMinutes, payJPY
  - field: field: { siteName, dayRateJPY, transportJPY, allowanceJPY, notes }, payJPY

### 連携
- `.env` の `VITE_WEBHOOK_URL` を指定すると、現場登録時に JSON をPOST。既存システムやSupabase等と繋ぎやすい。

### 注意
- 本プロトは最小実装。勤怠の丸め（15分単位等）、深夜/残業/休日割増、承認フロー、シフト、位置情報、IC打刻、CSVエクスポート等は必要に応じて拡張してください。
