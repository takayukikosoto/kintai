# Windsurf: “string field contains invalid UTF-8” 対処メモ

**エラー:**  
`Internal: marshal message: string field contains invalid UTF-8`

**現象:** Claude / GPT‑5 だけ失敗し、**o3 だけ通る**ことがある。これは o3 側が寛容（または別マ―シャラ）なためで、**リクエスト内に UTF‑8 として不正な文字列**が混入しているのが主因。

---

## よくある原因
- ワークスペース内に **Shift_JIS / CP932 のファイル**が混ざっている
- 画像/動画/フォント/DB ダンプなどの **バイナリが誤ってコンテキストに含まれている**
- 端末ログや出力に **制御文字 / 不完全なサロゲート**（壊れ絵文字等）が含まれ、それを貼り付けている
- 旧エンコーディングの Markdown/CSV を開いたまま **「Entire workspace / Include open files」** で投げている

---

## 最短復旧チェックリスト（上から順に）
1. **送信範囲を最小化**  
   - Windsurf の対象を一旦 **Open files だけ**にする。さらに **生テキストのみ**でテスト。→ これで通れば **ワークスペース由来**の混入確定。

2. **生成物・バイナリを除外**  
   - `.windsurfignore` か Exclude で `node_modules/ .git/ .next/ dist/ build/ public/**.png|jpg|mp4|woff|db` 等を外す。

3. **非 UTF‑8 ファイルを検出 → 変換**  
   - プロジェクト直下で（`.git` 配下は除外）:
   ```bash
   find . -type f -not -path '*/.git/*' -print0 | \
   xargs -0 -I{} bash -lc 'iconv -f utf-8 -t utf-8 "{}" -o /dev/null 2>/dev/null || echo "{}"'
   ```
   - 出力されたファイルは「UTF‑8 として不正」。多くは **CP932/Shift_JIS**。変換例:
   ```bash
   iconv -f SHIFT_JIS -t UTF-8 bad.md > fixed.md && mv fixed.md bad.md
   ```

4. **制御文字の混入チェック**  
   ```bash
   rg -nU --hidden --glob '!{.git,node_modules,.next,dist,build}' \
     '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
   ```
   対象行を目視して不可視文字を削除。

5. **壊れた絵文字/不完全サロゲートの検出スクリプト**  
   `clean_bad_unicode.py`（検出のみ）:
   ```python
   import sys, pathlib
   bad = []
   for p in pathlib.Path('.').rglob('*'):
       if p.is_file() and '.git' not in p.parts and p.suffix.lower() not in {
           '.png','.jpg','.jpeg','.gif','.webp','.mp4','.mov','.mkv','.avi',
           '.woff','.woff2','.ttf','.otf','.pdf','.ico','.db','.sqlite'
       }:
           try:
               data = p.read_bytes()
               data.decode('utf-8')  # ここで失敗すれば壊れている
           except UnicodeDecodeError:
               bad.append(str(p))
   print('\n'.join(bad))
   ```
   出力に対して、元のエンコーディング（多くは **CP932/Shift_JIS**）を推定して `iconv` で UTF‑8 へ変換。

6. **ログや巨大 JSON をそのまま貼らない**  
   - ANSI カラーやヌルバイト混入のログは **要約**して渡す。必要なら UTF‑8 の `.txt` として保存して添付。

7. **エディタの既定エンコーディングを UTF‑8 に固定**  
   - Windsurf/VSCode: ステータスバー Encoding → **Reopen with Encoding: UTF‑8** → **Save with Encoding**。

8. **切り分け**  
   - 空の新規プロジェクトで Claude/GPT‑5 が動くか確認。動くなら元プロジェクト側に原因確定。
   - 「Include workspace context」を **OFF** → テスト → **ON に戻す** → フォルダ単位で再追加し **再現するフォルダ** を特定。

---

## `.windsurfignore` の例（生成物・バイナリ除外）
```
# VCS / deps / build
.git/
node_modules/
.next/
dist/
build/
out/

# Static & binaries
public/**/*.png
public/**/*.jpg
public/**/*.jpeg
public/**/*.gif
public/**/*.webp
public/**/*.svg
public/**/*.ico
**/*.mp4
**/*.mov
**/*.mkv
**/*.avi
**/*.pdf
**/*.db
**/*.sqlite
**/*.ttf
**/*.otf
**/*.woff
**/*.woff2
```

---

## 使い方（o3 に読ませる手順）
1. この Markdown を Windsurf か o3 に **そのまま読み込ませる**。
2. まず「**送信範囲最小化** → **除外設定** → **非 UTF‑8 検出と変換**」の順で実行。
3. テストは **短い素のテキスト**で行い、通ることを確認したら徐々に対象を広げる。

> コア原則: **LLM に渡る入力を “純粋な UTF‑8 のテキストだけ” にする。**  
> まずは 1) 送信範囲縮小 と 3) 非 UTF‑8 検出 を実施すれば、ほぼ解消します。
