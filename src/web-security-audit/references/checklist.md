# セキュリティ監査 - 参照ドキュメント

## 検索パターン一覧

### 1. 外部通信関連パターン

#### HTTP/HTTPS通信
```regex
fetch\s*\(
XMLHttpRequest
axios\.(get|post|put|delete|patch)
http\.request
https\.request
request\(
got\(
superagent
needle
```

#### WebSocket通信
```regex
new\s+WebSocket\(
ws://
wss://
socket\.io
```

#### その他のネットワーク通信
```regex
net\.connect
dgram\.
dns\.resolve
```

### 2. データ保存関連パターン

#### ブラウザストレージ
```regex
localStorage\.(setItem|getItem)
sessionStorage\.(setItem|getItem)
document\.cookie
```

#### データベース
```regex
indexedDB\.open
openDatabase\(
new\s+Dexie\(
mongoose\.connect
sequelize
knex
```

#### ファイルシステム（Node.js）
```regex
fs\.writeFile
fs\.appendFile
fs\.createWriteStream
writeFileSync
```

### 3. 危険なコード実行パターン

#### 動的コード実行
```regex
eval\s*\(
new\s+Function\(
setTimeout\s*\(\s*["']
setInterval\s*\(\s*["']
```

#### コマンド実行
```regex
child_process\.exec
child_process\.spawn
child_process\.execFile
shell\.exec
require\(['"]child_process['"]\)
```

#### テンプレートインジェクション
```regex
<script>
innerHTML\s*=
dangerouslySetInnerHTML
v-html=
```

### 4. 認証・認可関連パターン

#### 機密情報のパターン
```regex
password\s*[:=]
api[_-]?key\s*[:=]
secret\s*[:=]
token\s*[:=]
private[_-]?key\s*[:=]
access[_-]?token\s*[:=]
bearer\s+
authorization:\s*
```

#### 環境変数アクセス
```regex
process\.env\.
\$\{env:
ENV\[['"]
os\.environ
```

### 5. SQLインジェクション

```regex
SELECT\s+.*?\$\{
INSERT\s+INTO\s+.*?\$\{
UPDATE\s+.*?SET\s+.*?\$\{
DELETE\s+FROM\s+.*?\$\{
"SELECT\s+.*?"\s*\+\s*
'SELECT\s+.*?'\s*\+\s*
query\(.*?\+.*?\)
```

### 6. XSS（クロスサイトスクリプティング）

```regex
innerHTML\s*=\s*.*?\+
\.html\(.*?\+
document\.write\(
eval\(.*?request
\$\{.*?req\.
dangerouslySetInnerHTML.*?\{
v-html=
```

### 7. パストラバーサル

```regex
\.\./
\.\.\\
path\.join\(.*?req\.
fs\.readFile\(.*?req\.
```

### 8. CSRF（クロスサイトリクエストフォージェリ）

```regex
cors\(
Access-Control-Allow-Origin:\s*\*
withCredentials:\s*true
```

## チェックリスト

### 外部通信チェックリスト

- [ ] すべてのfetch呼び出しの送信先を確認
- [ ] XMLHttpRequestの使用箇所を特定
- [ ] WebSocketの接続先を確認
- [ ] アナリティクスライブラリ（Google Analytics等）の有無
- [ ] トラッキングコード（Facebook Pixel等）の有無
- [ ] 外部APIへのデータ送信内容を確認
- [ ] ユーザー同意なしのデータ送信がないか確認

### データ保存チェックリスト

- [ ] localStorageに保存されるデータの内容
- [ ] sessionStorageの使用目的
- [ ] Cookieに保存される情報
- [ ] IndexedDBの使用状況
- [ ] 個人情報の暗号化有無
- [ ] データ保持期間の設定
- [ ] データ削除機能の実装

### 脆弱性チェックリスト

#### コード実行
- [ ] eval()の使用がないか
- [ ] new Function()の使用がないか
- [ ] 子プロセス実行時の入力検証
- [ ] 動的require()の安全性

#### インジェクション
- [ ] SQLクエリのパラメーター化
- [ ] ユーザー入力のサニタイズ
- [ ] HTMLエスケープ処理
- [ ] コマンドライン引数の検証

#### 認証・認可
- [ ] パスワードのハッシュ化
- [ ] トークンの安全な保存
- [ ] セッション管理の実装
- [ ] 権限チェックの実装

#### データ露出
- [ ] エラーメッセージの詳細度
- [ ] デバッグコードの削除
- [ ] 環境変数の適切な管理
- [ ] .gitignoreの設定

### サードパーティライブラリチェックリスト

- [ ] すべての依存ライブラリの目的を確認
- [ ] 最終更新日を確認（メンテナンス状況）
- [ ] 既知の脆弱性をチェック（npm audit等）
- [ ] ライセンスの確認
- [ ] ダウンロード数や信頼性の評価
- [ ] 不要な依存関係の削除

## リスク評価マトリックス

### リスクレベルの定義

| レベル | 説明 | 例 |
|-------|-------------|---------|
| **極めて低い** | ほぼリスクなし | ローカル処理のみ |
| **低** | 最小限のリスク | 信頼できるライブラリのみ使用 |
| **中** | 注意が必要 | 子プロセスの実行、環境変数へのアクセス |
| **高** | 重大なリスク | 検証されていない外部入力、危険なコード実行 |
| **致命的** | 即時対応が必要 | 認証情報の露出、SQLインジェクション |

#### リスクレベルの判定基準

| 項目 | 極めて低い | 低 | 中 | 高 | 致命的 |
|------|----------|-----|--------|------|----------|
| **外部通信** | なし | 信頼できるAPI | サードパーティAPI | 不明なエンドポイント | 暗号化なし送信 |
| **データ保存** | なし | 設定値のみ | 非機密データ | 個人情報（暗号化） | 個人情報（平文） |
| **コード実行** | なし | 静的コードのみ | 検証済み動的実行 | 制限付き動的実行 | 未検証動的実行 |
| **入力検証** | 該当なし | 完全検証 | 基本検証 | 部分的検証 | 検証なし |
| **認証** | 該当なし | 多要素認証 | 基本認証 | 弱い認証 | 認証なし |

### 脆弱性の深刻度

| CVSS | レベル | 対応期限 |
|------|-------|-------------------|
| 9.0–10.0 | 致命的 | 即座 |
| 7.0–8.9 | 高 | 1週間以内 |
| 4.0–6.9 | 中 | 1か月以内 |
| 0.1–3.9 | 低 | 次回リリース |

## セキュリティベストプラクティス

### 1. 入力検証

```typescript
// ❌ 悪い例
const userId = req.query.id;
db.query(`SELECT * FROM users WHERE id = ${userId}`);

// ✅ 良い例
const userId = parseInt(req.query.id);
if (isNaN(userId) || userId < 0) {
  throw new Error('無効なユーザーIDです');
}
db.query('SELECT * FROM users WHERE id = ?', [userId]);
```

### 2. 出力エスケープ

```javascript
// ❌ 悪い例
element.innerHTML = userInput;

// ✅ 良い例
element.textContent = userInput;
// または
element.innerHTML = DOMPurify.sanitize(userInput);
```

### 3. 機密情報の管理

```bash
# ❌ 悪い例
API_KEY=abc123  # コードに直接記述

# ✅ 良い例
# .env ファイルに保存
API_KEY=abc123

# .gitignore に追加
echo ".env" >> .gitignore
```

### 4. 子プロセス実行

```typescript
// ❌ 悪い例
const { exec } = require('child_process');
exec(`ls ${userInput}`);

// ✅ 良い例
const { spawn } = require('child_process');
spawn('ls', [userInput]);
```

### 5. CORS設定

```javascript
// ❌ 悪い例
app.use(cors({ origin: '*' }));

// ✅ 良い例
app.use(cors({
  origin: 'https://trusted-domain.com',
  credentials: true
}));
```

## 外部通信の評価基準

### 信頼できる外部通信の条件

1. **必要性**：機能実装に必須
2. **透明性**：ユーザーに明示されている
3. **同意**：ユーザーの同意を得ている
4. **暗号化**：HTTPS/TLS使用
5. **最小限**：必要最小限のデータ送信
6. **プライバシー**：個人情報の適切な扱い

### 問題のある外部通信の特徴

1. **隠蔽**：ユーザーに通知なし
2. **過剰**：不要なデータ送信
3. **平文**：暗号化なし
4. **トラッキング**：同意なしのトラッキング
5. **不明**：送信先が不明確
6. **漏洩**：機密情報の送信

## よくある誤検知パターン

### 1. コメント内のコード

```javascript
// この関数では eval() を使わないでください
function safeExecute(code) {
  // 安全な実装
}
```

→ コメント内の`eval()`は実際には実行されない

### 2. 文字列リテラル

```javascript
const warning = "eval() は危険です";
console.log(warning);
```

→ 文字列としての言及は問題なし

### 3. テストコード

```javascript
// test/security.spec.ts
it('evalインジェクションを防ぐこと', () => {
  expect(() => eval(userInput)).toThrow();
});
```

→ テスト目的の使用は許容される場合がある

### 4. 開発用デバッグコード

```javascript
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', sensitiveData);
}
```

→ 本番環境では実行されない

## ツールと自動化

### 推奨ツール

1. **npm audit**：npm依存関係の脆弱性チェック
2. **Snyk**：継続的なセキュリティ監視
3. **ESLint security plugins**：静的解析
4. **OWASP ZAP**：動的セキュリティテスト
5. **SonarQube**：コード品質とセキュリティ分析

### コマンド例

```bash
# npm依存関係の脆弱性チェック
npm audit

# 詳細レポート
npm audit --json

# 自動修正（注意して使用）
npm audit fix

# Snykスキャン
npx snyk test

# ESLintセキュリティチェック
npx eslint --plugin security .
```

## 関連リンク

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
