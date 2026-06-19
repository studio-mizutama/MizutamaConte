// electron/pathFix.ts
// macOS の Finder/Dock 起動では GUI アプリの PATH が launchd の最小値
// （/usr/bin:/bin:/usr/sbin:/sbin）になり、Homebrew の /opt/homebrew/bin（Intel は
// /usr/local/bin）が落ちる。すると execFile('git', ['lfs', ...]) が git-lfs を解決できず
// バージョン管理が「未インストール」と誤検出される（git-lfs は Homebrew 等にしか無いため）。
// main プロセス起動時に process.env.PATH を補正し、子プロセス（git / git-lfs フィルタ /
// paint の which）すべてに継承させて根治する。
// NOTE: electron を import しない（process.env のみ依存）。これにより renderer の vitest
//       スコープから相対 import してテストできる（electron/git.ts と同方針）。

/** OS ごとに PATH 先頭へ補う well-known な bin ディレクトリ。win32 は不要（インストーラが
 *  システム PATH に登録し GUI も継承するため）。 */
const EXTRA_DIRS: Readonly<Record<string, readonly string[]>> = {
  darwin: ['/opt/homebrew/bin', '/usr/local/bin', '/opt/local/bin'],
  linux: ['/usr/local/bin', '/snap/bin'],
};

/**
 * base（PATH 文字列）の先頭へ extras を前置し、重複・空セグメントを除去して返す純関数。
 * 既出ディレクトリは最初の出現のみ残す（extras を前置するので extras 側が優先される）。
 *
 * @param base   現在の PATH（`:` 区切り）
 * @param extras 先頭へ補いたいディレクトリ
 * @returns 補正後の PATH 文字列（`:` 区切り）
 */
export const mergePath = (base: string, extras: readonly string[]): string => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of [...extras, ...base.split(':')]) {
    const dir = entry.trim();
    if (!dir || seen.has(dir)) continue;
    seen.add(dir);
    out.push(dir);
  }
  return out.join(':');
};

/**
 * 現在 OS に応じて process.env.PATH を補正する（main 起動時に 1 回呼ぶ）。
 * win32 などマップに無い OS では何もしない。
 *
 * @param platform 既定は process.platform（テスト用に上書き可能）
 */
export const applyPathFix = (platform: string = process.platform): void => {
  const extras = EXTRA_DIRS[platform];
  if (!extras) return; // win32 等: 補正不要
  process.env.PATH = mergePath(process.env.PATH ?? '', extras);
};
