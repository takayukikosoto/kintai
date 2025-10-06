#!/usr/bin/env node

/**
 * 管理者権限を設定するスクリプト
 * 
 * 使い方:
 * 1. Firebase Admin SDKをインストール: npm install firebase-admin
 * 2. サービスアカウントキーをダウンロード
 * 3. 環境変数を設定: export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"
 * 4. 実行: node scripts/setAdmin.js <user-email>
 */

import admin from 'firebase-admin'

// Firebase Admin初期化
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'kintai-f16b6'
  })
}

async function setAdminClaim(email) {
  try {
    const user = await admin.auth().getUserByEmail(email)
    
    // 管理者権限を設定
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true
    })
    
    console.log(`✅ 管理者権限を付与しました: ${email} (UID: ${user.uid})`)
    console.log('⚠️  ユーザーは一度ログアウト→ログインする必要があります')
    
  } catch (error) {
    console.error('❌ エラー:', error.message)
    process.exit(1)
  }
}

async function removeAdminClaim(email) {
  try {
    const user = await admin.auth().getUserByEmail(email)
    
    // 管理者権限を削除
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: false
    })
    
    console.log(`✅ 管理者権限を削除しました: ${email} (UID: ${user.uid})`)
    console.log('⚠️  ユーザーは一度ログアウト→ログインする必要があります')
    
  } catch (error) {
    console.error('❌ エラー:', error.message)
    process.exit(1)
  }
}

async function listAdmins() {
  try {
    const listUsersResult = await admin.auth().listUsers()
    const admins = []
    
    for (const user of listUsersResult.users) {
      const userRecord = await admin.auth().getUser(user.uid)
      if (userRecord.customClaims?.admin) {
        admins.push({
          email: user.email,
          uid: user.uid
        })
      }
    }
    
    if (admins.length === 0) {
      console.log('管理者はいません')
    } else {
      console.log('📋 管理者一覧:')
      admins.forEach(admin => {
        console.log(`  - ${admin.email} (${admin.uid})`)
      })
    }
    
  } catch (error) {
    console.error('❌ エラー:', error.message)
    process.exit(1)
  }
}

// コマンドライン引数を処理
const args = process.argv.slice(2)
const command = args[0]
const email = args[1]

if (command === 'add' && email) {
  setAdminClaim(email).then(() => process.exit(0))
} else if (command === 'remove' && email) {
  removeAdminClaim(email).then(() => process.exit(0))
} else if (command === 'list') {
  listAdmins().then(() => process.exit(0))
} else {
  console.log(`
使い方:
  node scripts/setAdmin.js add <email>     - 管理者権限を付与
  node scripts/setAdmin.js remove <email>  - 管理者権限を削除
  node scripts/setAdmin.js list            - 管理者一覧を表示

例:
  node scripts/setAdmin.js add admin@example.com
  `)
  process.exit(1)
}
