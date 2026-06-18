// src/git/types.ts
// git バージョン管理の共有型（renderer ↔ Sandbox 境界で使用）。
// NOTE: electron/git.ts はこのファイルを import できない（main/renderer は tsconfig 分離）。
//       electron 側は同形のローカル interface を持つ（settings.ts と同じ二重定義方針）。

/** git / git-lfs の導入状況とプラットフォーム（起動時 1 回検出してグローバルに格納） */
export interface GitDetect {
  hasGit: boolean;
  hasLfs: boolean;
  platform: string;
}

/** `git log -1` の最小情報（E2 のスナップショット状態表示で使用） */
export interface GitLogEntry {
  hash: string;
  date: string;
  subject: string;
}

/** VC が利用可能か（git と git-lfs の両方が導入済み）。表記揺れ防止のため判定はここに集約する。 */
export const gitReady = (d?: GitDetect): boolean => !!d?.hasGit && !!d?.hasLfs;
