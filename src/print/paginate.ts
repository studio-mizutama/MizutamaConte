export interface CutBlock {
  /** 元の CUT index（0始まり）。 */
  index: number;
  /** この CUT でシーンが始まるか（始まるなら必ず新ページ先頭）。 */
  isSceneStart: boolean;
  /** 実測した CUT 行の高さ（px）。 */
  height: number;
}

export interface Page {
  /** 1始まりのページ番号。 */
  pageNumber: number;
  /** このページに載る CUT index 群（元順序）。 */
  cutIndices: number[];
}

/**
 * CUT 群をページに割り付ける純粋関数。不変条件:
 * 1. 1 CUT は分割しない（CutBlock は atomic）
 * 2. isSceneStart の CUT は必ず新ページ先頭
 * 3. 累積高が capacity を超えたら新ページ（貪欲詰め）
 * 4. 単体で capacity 超の巨大 CUT は単独ページ（はみ出し許容・無限ループ防止）
 */
export const paginate = (blocks: CutBlock[], capacity: number): Page[] => {
  const pages: Page[] = [];
  let current: number[] = [];
  let used = 0;

  const flush = () => {
    if (current.length > 0) {
      pages.push({ pageNumber: pages.length + 1, cutIndices: current });
      current = [];
      used = 0;
    }
  };

  for (const b of blocks) {
    const sceneBreak = b.isSceneStart && current.length > 0;
    const overflow = current.length > 0 && used + b.height > capacity;
    if (sceneBreak || overflow) flush();
    current.push(b.index);
    used += b.height;
  }
  flush();
  return pages;
};
