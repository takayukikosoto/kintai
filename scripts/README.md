# 管理者権限設定ガイド

## 概要
このスクリプトを使用して、ユーザーに管理者権限を付与できます。管理者はQRスキャナーで全ユーザーの打刻ができます。

## セットアップ

### 1. Firebase Admin SDKをインストール

```bash
npm install firebase-admin --save-dev
```

### 2. サービスアカウントキーを取得

1. Firebase Console を開く: https://console.firebase.google.com/project/kintai-f16b6/settings/serviceaccounts/adminsdk
2. 「新しい秘密鍵の生成」をクリック
3. ダウンロードした JSON ファイルを `scripts/serviceAccountKey.json` として保存

⚠️ **重要**: `serviceAccountKey.json` は絶対に Git にコミットしないでください！

### 3. 環境変数を設定

```bash
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/scripts/serviceAccountKey.json"
```

または、`.env` ファイルに追加（プロジェクトルート）:
```
GOOGLE_APPLICATION_CREDENTIALS=./scripts/serviceAccountKey.json
```

## 使い方

### 管理者権限を付与

```bash
node scripts/setAdmin.js add admin@example.com
```

### 管理者権限を削除

```bash
node scripts/setAdmin.js remove admin@example.com
```

### 管理者一覧を表示

```bash
node scripts/setAdmin.js list
```

## 注意事項

1. **権限付与後はログアウト→ログインが必要**
   - Custom Claims はトークンに含まれるため、再ログインしないと反映されません

2. **管理者の機能**
   - 📷 QRスキャナー: 全ユーザーのQRコードで打刻可能
   - ⚙️ 管理設定: レートプリセットの作成・編集
   - 👁️ 全タイムシート閲覧: すべてのユーザーの勤怠履歴を閲覧可能

3. **セキュリティ**
   - サービスアカウントキーは厳重に管理してください
   - `.gitignore` に `serviceAccountKey.json` が含まれていることを確認してください

## トラブルシューティング

### エラー: "Cannot find module 'firebase-admin'"
```bash
npm install firebase-admin --save-dev
```

### エラー: "GOOGLE_APPLICATION_CREDENTIALS not set"
環境変数が設定されていません。上記のセットアップ手順を確認してください。

### 権限が反映されない
ユーザーが一度ログアウト→ログインしてください。トークンが更新されます。
