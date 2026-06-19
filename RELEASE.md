# リリース手順（Mizutama Conte）

CI は使っていない。**この Mac（Apple Silicon）から手動で**全プラットフォームのバイナリを作り、
GitHub Release に添付する。Web/docs は `gh-pages` に手動デプロイする。

> v0.9.0 / v0.9.1 はこの手順で配布した。コード署名・公証（notarization）は当面なし（未署名配布）。
> Windows は wine を入れていないため **zip 配布**（nsis インストーラは作らない）。

## 0. 前提

- ブランチ運用: 作業は `develop`、リリースは `develop` → `master` にマージしてタグを打つ。
- バージョンは `package.json` の `version` が単一ソース。`__APP_VERSION__`（vite `define`）経由で
  アプリ About 表示・PWA・docs サイトに自動反映される。
- `gh` CLI でログイン済みであること（`gh auth status`）。

## 1. リリース前チェック（develop で）

```sh
yarn typecheck      # renderer + electron
yarn test           # vitest 全件
yarn build          # electron-vite（main/preload/renderer）
yarn build:web      # Web 版
yarn build:docs     # ドキュメントサイト
```

すべて green を確認。必要なら `yarn dist:dir` で素の .app を作り Finder 起動で実機 smoke。
（PATH 依存の不具合は **Finder/Dock 起動**でしか再現しない。ターミナル起動はフル PATH を継承するため不可。）

## 2. バージョン繰り上げ

`package.json` の `version` を更新（例 `0.9.0` → `0.9.1`）。コミットしておく。

## 3. develop → master マージ

```sh
git checkout master
git merge --no-ff develop -m "release: vX.Y.Z"
# master の tree が develop と一致することを確認
[ "$(git rev-parse master^{tree})" = "$(git rev-parse develop^{tree})" ] && echo OK
```

## 4. バイナリをビルド（この Mac で・2 回に分ける）

arch フラグはグローバルに効くため、**mac（arm64+x64）と win/linux（x64 のみ）を分けて**実行する。
1 回で `-mwl --arm64 --x64` とすると linux/win にも arm64 が増えて構成がズレる。

```sh
rm -rf dist
yarn build                                                   # out/ を最新化
yarn electron-builder --mac dmg zip --arm64 --x64            # mac: arm64 + x64（dmg + zip）
yarn electron-builder --win zip --linux AppImage tar.gz --x64  # win: x64 zip / linux: x64 AppImage + tar.gz
```

出力（`dist/` 直下・全 7 点。`.blockmap` と `latest-*.yml` は添付しない）:

| OS / arch | ファイル |
|---|---|
| macOS arm64 | `Mizutama Conte-X.Y.Z-arm64.dmg` / `Mizutama Conte-X.Y.Z-arm64-mac.zip` |
| macOS x64 | `Mizutama Conte-X.Y.Z.dmg` / `Mizutama Conte-X.Y.Z-mac.zip` |
| Windows x64 | `Mizutama Conte-X.Y.Z-win.zip`（ポータブル・解凍して `.exe` 実行） |
| Linux x64 | `Mizutama Conte-X.Y.Z.AppImage` / `mizutama-conte-X.Y.Z.tar.gz` |

> 補足: electron-builder は arch 接尾辞を非 x64 のみに付ける（x64 は接尾辞なし）。
> ローカルのファイル名は半角スペースだが、GitHub アップロード時に空白はドットに変換される。
> wine を入れれば Windows の nsis インストーラも作れる（`brew install --cask wine-stable` 等）。

## 5. タグを打って push

```sh
git push origin master
git tag -a vX.Y.Z -m "release: vX.Y.Z (beta)"
git push origin vX.Y.Z
```

## 6. GitHub Release を作成（7 点添付）

```sh
gh release create vX.Y.Z \
  --title "Mizutama Conte vX.Y.Z (beta)" \
  --notes-file <リリースノート.md> \
  "dist/Mizutama Conte-X.Y.Z-arm64.dmg" \
  "dist/Mizutama Conte-X.Y.Z-arm64-mac.zip" \
  "dist/Mizutama Conte-X.Y.Z.dmg" \
  "dist/Mizutama Conte-X.Y.Z-mac.zip" \
  "dist/Mizutama Conte-X.Y.Z-win.zip" \
  "dist/Mizutama Conte-X.Y.Z.AppImage" \
  "dist/mizutama-conte-X.Y.Z.tar.gz"
```

リリースノートは **日本語 → 한국어 → English** の順。hotfix は変更点を箇条書きで簡潔に
（アプリの挙動に関わる項目のみ。ドキュメント修正などは載せない）。

## 7. Web / docs をデプロイ

```sh
yarn deploy   # build:web && build:docs && gh-pages -d build
```

公開先:
- Web: https://studio-mizutama.github.io/MizutamaConte/
- Docs: https://studio-mizutama.github.io/MizutamaConte/docs/

## 8. 後処理

- `master` への追従を `develop` に戻す（`git checkout develop && git merge --ff-only master && git push origin develop`）。
- 本番 URL を curl 等で軽く確認（バージョン反映・404 がないか）。
