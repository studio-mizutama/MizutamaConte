import { describe, expect, it } from 'vitest';
import { cutCanvas, sameCanvas, canMerge, deriveScenes } from '../scene';
import { ProjectCut } from '../types';

const cut = (over: Partial<ProjectCut> & { w: number; h: number }): ProjectCut => ({
  id: over.id ?? Math.random().toString(36).slice(2),
  psd: over.psd,
  time: over.time,
  sceneStart: over.sceneStart,
  rows: [{ id: 'r', layer: '1', canvas: { width: over.w, height: over.h } }],
});

describe('cutCanvas', () => {
  it('先頭行の canvas を代表値として返す', () => {
    expect(cutCanvas(cut({ w: 1920, h: 1080 }))).toEqual({ width: 1920, height: 1080 });
  });
});

describe('sameCanvas / canMerge', () => {
  it('同一サイズなら true、異なれば false', () => {
    expect(sameCanvas({ width: 100, height: 50 }, { width: 100, height: 50 })).toBe(true);
    expect(sameCanvas({ width: 100, height: 50 }, { width: 100, height: 60 })).toBe(false);
  });
  it('canMerge はキャンバス一致のときだけ true', () => {
    expect(canMerge(cut({ w: 1920, h: 1080 }), cut({ w: 1920, h: 1080 }))).toBe(true);
    expect(canMerge(cut({ w: 1920, h: 1080 }), cut({ w: 1280, h: 720 }))).toBe(false);
  });
});

describe('deriveScenes', () => {
  it('マーカーが無ければ全カットを暗黙の Scene 1 にまとめる', () => {
    const cuts = [cut({ w: 100, h: 50 }), cut({ w: 100, h: 50 }), cut({ w: 100, h: 50 })];
    const scenes = deriveScenes(cuts);
    expect(scenes).toHaveLength(1);
    expect(scenes[0].sceneNumber).toBe(1);
    expect(scenes[0].startIndex).toBe(0);
    expect(scenes[0].cutIndices).toEqual([0, 1, 2]);
    expect(scenes[0].title).toBeUndefined();
  });
  it('sceneStart マーカーでシーンを分割し通し番号を振る', () => {
    const cuts = [
      cut({ w: 100, h: 50 }),
      cut({ w: 100, h: 50, sceneStart: { title: '屋上' } }),
      cut({ w: 100, h: 50 }),
    ];
    const scenes = deriveScenes(cuts);
    expect(scenes).toHaveLength(2);
    expect(scenes[0].cutIndices).toEqual([0]);
    expect(scenes[1].sceneNumber).toBe(2);
    expect(scenes[1].title).toBe('屋上');
    expect(scenes[1].cutIndices).toEqual([1, 2]);
  });
  it('先頭カットの sceneStart タイトルも採用する', () => {
    const cuts = [cut({ w: 100, h: 50, sceneStart: { title: 'オープニング' } })];
    expect(deriveScenes(cuts)[0].title).toBe('オープニング');
  });
  it('空配列なら空配列を返す', () => {
    expect(deriveScenes([])).toEqual([]);
  });
});
