import { describe, it, expect } from 'vitest';
import { mergeCuts, orphanedPsdAfterMerge } from '../actions';
import { ProjectFile, ProjectCut } from '../types';

const cut = (id: string, psd: string): ProjectCut => ({
  id,
  psd,
  time: 24,
  rows: [{ id: id + 'r', layer: '1', dialogue: '', canvas: { width: 100, height: 100 } }],
});

const project = (cuts: ProjectCut[]): ProjectFile => ({
  version: 2,
  title: 'T',
  settings: { aspect: '16:9', resolution: 'FHD', frame: { width: 1920, height: 1080 }, fps: 24 },
  cuts,
});

describe('mergeCuts', () => {
  it('removes the lower cut and merges its rows + time into the upper', () => {
    const p = project([cut('a', 'c001.psd'), cut('b', 'c002.psd'), cut('c', 'c003.psd')]);
    const merged = mergeCuts(p, 0);
    expect(merged.cuts).toHaveLength(2);
    expect(merged.cuts[0].psd).toBe('c001.psd'); // 上CUTの PSD を維持
    expect(merged.cuts[0].rows).toHaveLength(2); // 行が連結
    expect(merged.cuts[0].time).toBe(48); // 尺合算
    expect(merged.cuts[1].psd).toBe('c003.psd');
  });
});

describe('orphanedPsdAfterMerge', () => {
  it('returns the lower cut PSD when it becomes unreferenced after merge', () => {
    const p = project([cut('a', 'c001.psd'), cut('b', 'c002.psd')]);
    expect(orphanedPsdAfterMerge(p, 0)).toBe('c002.psd');
  });

  it('returns null when another cut still references the same PSD (defensive)', () => {
    // データ異常: 別カットが下CUTと同じ PSD を参照 → 削除しない
    const p = project([cut('a', 'c001.psd'), cut('b', 'c002.psd'), cut('c', 'c002.psd')]);
    expect(orphanedPsdAfterMerge(p, 0)).toBeNull();
  });

  it('returns null when upper and lower share the same PSD', () => {
    const p = project([cut('a', 'shared.psd'), cut('b', 'shared.psd')]);
    expect(orphanedPsdAfterMerge(p, 0)).toBeNull();
  });

  it('returns null when there is no next cut', () => {
    const p = project([cut('a', 'c001.psd')]);
    expect(orphanedPsdAfterMerge(p, 0)).toBeNull();
  });

  it('is case-insensitive: does not orphan a PSD still referenced under different casing (Mac/Win FS)', () => {
    const p = project([cut('a', 'c001.psd'), cut('b', 'c002.psd'), cut('c', 'C002.PSD')]);
    expect(orphanedPsdAfterMerge(p, 0)).toBeNull();
  });
});
