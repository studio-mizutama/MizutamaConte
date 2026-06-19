# リリース手順（Mizutama Conte）

リリースは **GitHub Actions（CI）** で自動化している。署名・公証（notarization）は当面なし（未署名配布）。
secrets は不要（`GITHUB_TOKEN` のみで Release 作成・gh-pages push が動く）。

## ワークフロー一覧（`.github/workflows/`）

| ファイル | トリガー | 役割 |
|---|---|---|
| `release.yml` | `vX.Y.Z` タグ push | 3 OS をネイティブビルド（wine 不要）→ `CHANGELOG.md` から本文抽出 → GitHub Release 作成＋全バイナリ添付 |
| `pages.yml` | `master` への push（web/docs 関連パス）＋ 手動 | Web 版・docs を `gh-pages` へデプロイ |

ビルド構成（`package.json` の `build` で OS ごとに固定）:
- macOS: `dmg` + `zip`（arm64 + x64）
- Windows: `nsis`（インストーラ）+ `zip`（ポータブル）（x64）
- Linux: `AppImage` + `tar.gz`（x64）

## 通常リリース（これだけ）

1. `develop` で開発・検証（`yarn test` / `yarn typecheck` / `yarn build`）。
2. `package.json` の `version` を更新（例 `0.9.1` → `0.9.2`）。
3. `CHANGELOG.md` の先頭に `## vX.Y.Z` 節を追記（日本語 → 한국어 → English・簡潔に）。
   この節の中身がそのまま Release 本文になる。
4. `develop` → `master` にマージ。
5. タグを打って push:

   ```sh
   git push origin master --follow-tags   # master 反映で web 自動デプロイ
   git tag -a vX.Y.Z -m "release: vX.Y.Z"
   git push origin vX.Y.Z                  # タグで 3 OS ビルド＋Release 作成
   ```

   → `release.yml` が全 OS をビルドして Release を作り、`pages.yml` が web/docs を更新する。

### (beta) 表記・安定版への切替

- 現状は `release.yml` の `RELEASE_TITLE_SUFFIX: ' (beta)'` によりタイトルが「… (beta)」になる（prerelease=false＝Latest 扱い）。
- 安定版にするときは `RELEASE_TITLE_SUFFIX` を `''` にする。prerelease 扱いにしたい場合は `release.yml` の release ジョブの `prerelease: false` を `true` に変更する。

### ドキュメントだけ更新したいとき

`docs-site/` 等を変更して `master` に push すれば `pages.yml` が自動でデプロイする。
Actions 画面の「Run workflow」からの手動実行、またはローカルの `yarn deploy` でも可。

## 手動フォールバック（CI が使えないとき）

CI 不調時は Mac からローカルでも作れる（ただし **Windows の nsis インストーラは wine が必要なため Mac では作れない**。
Mac ローカルでは Windows は zip のみ。nsis は CI もしくは Windows 実機で）。

```sh
rm -rf dist
yarn build
yarn electron-builder --mac dmg zip --arm64 --x64        # mac arm64 + x64
yarn electron-builder --linux AppImage tar.gz --x64      # linux x64
yarn electron-builder --win zip --x64                     # win x64 zip のみ（nsis は不可）
gh release create vX.Y.Z --title "Mizutama Conte vX.Y.Z (beta)" \
  --notes-file <ノート.md> "dist/"*.dmg "dist/"*.zip "dist/"*.AppImage "dist/"*.tar.gz
yarn deploy   # web/docs
```

> 補足: electron-builder は arch 接尾辞を非 x64 のみに付ける（x64 は接尾辞なし）。
> ローカルのファイル名は半角スペースだが GitHub アップロード時にドットへ変換される。
> 公開先 — Web: https://studio-mizutama.github.io/MizutamaConte/ ／ Docs: https://studio-mizutama.github.io/MizutamaConte/docs/
