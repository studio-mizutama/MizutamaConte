import { Psd } from 'ag-psd';
import { ProjectCut, PsdCache } from './types';

/** ProjectCut + PSD から表示用 Cut（旧形式・global 型）を導出する純粋関数 */
export const deriveDisplayCut = (cut: ProjectCut, psd: Psd | undefined): Cut => ({
  picture: psd,
  psdName: cut.psd,
  cameraWork: cut.cameraWork,
  action: cut.action,
  dialogue: cut.rows.map((row) => row.dialogue ?? '').join(''),
  time: cut.time,
});

export interface DisplayCacheEntry {
  psd: Psd | undefined;
  display: Cut;
}

/** 変化していないカット（同一 ProjectCut 参照かつ同一 PSD 参照）は前回の表示オブジェクトを
 *  再利用し参照を安定させる。React.memo を機能させるためのキー。 */
export const reconcileDisplayCuts = (
  cuts: ProjectCut[],
  psdCache: PsdCache,
  prev: Map<ProjectCut, DisplayCacheEntry>,
): { list: Cut[]; cache: Map<ProjectCut, DisplayCacheEntry> } => {
  const cache = new Map<ProjectCut, DisplayCacheEntry>();
  const list = cuts.map((cut) => {
    const psd = cut.psd ? psdCache[cut.psd] : undefined;
    const cached = prev.get(cut);
    if (cached && cached.psd === psd) {
      cache.set(cut, cached);
      return cached.display;
    }
    const display = deriveDisplayCut(cut, psd);
    cache.set(cut, { psd, display });
    return display;
  });
  return { list, cache };
};
