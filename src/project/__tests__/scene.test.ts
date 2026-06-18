import { describe, expect, it } from 'vitest';
import { cutCanvas, sameCanvas, canMerge, deriveScenes } from '../scene';
import {
  appendLayer,
  setSceneStart,
  setSceneTitle,
  appendSceneCut,
  resizeCutCanvas,
  mergeCuts,
  splitLastLayer,
} from '../actions';
import { emptyProject } from '../load';
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

const projectWith = (...cuts: ProjectCut[]) => ({ ...emptyProject('p'), cuts });

describe('appendLayer', () => {
  it('指定カットへ CUT と同一キャンバスの行を追加する', () => {
    const base = projectWith(cut({ w: 1920, h: 1080 }));
    const next = appendLayer(base, 0);
    expect(next.cuts[0].rows).toHaveLength(2);
    expect(next.cuts[0].rows[1].layer).toBe('2');
    expect(next.cuts[0].rows[1].canvas).toEqual({ width: 1920, height: 1080 });
  });
  it('元プロジェクトを変更しない（イミュータブル）', () => {
    const base = projectWith(cut({ w: 100, h: 50 }));
    appendLayer(base, 0);
    expect(base.cuts[0].rows).toHaveLength(1);
  });
});

describe('setSceneStart / setSceneTitle', () => {
  it('マーカーを付与・タイトル更新・解除できる', () => {
    const base = projectWith(cut({ w: 100, h: 50 }), cut({ w: 100, h: 50 }));
    const marked = setSceneStart(base, 1, { title: '夜' });
    expect(marked.cuts[1].sceneStart).toEqual({ title: '夜' });
    const retitled = setSceneTitle(marked, 1, '朝');
    expect(retitled.cuts[1].sceneStart).toEqual({ title: '朝' });
    const cleared = setSceneStart(retitled, 1, undefined);
    expect(cleared.cuts[1].sceneStart).toBeUndefined();
  });
});

describe('appendSceneCut', () => {
  it('新カットを追加し sceneStart を付与する', () => {
    const base = projectWith(cut({ w: 100, h: 50 }));
    const next = appendSceneCut(base, 'c002.psd', { width: 200, height: 100 }, 72, '屋上');
    expect(next.cuts).toHaveLength(2);
    expect(next.cuts[1].psd).toBe('c002.psd');
    expect(next.cuts[1].sceneStart).toEqual({ title: '屋上' });
    expect(next.cuts[1].rows[0].canvas).toEqual({ width: 200, height: 100 });
  });
});

describe('resizeCutCanvas', () => {
  const frame = { width: 1920, height: 1080 };
  it('全レイヤーの canvas を新サイズにし cover カメラを付与する', () => {
    const base = projectWith({
      ...cut({ w: 2400, h: 1350 }),
      rows: [
        { id: 'a', layer: '1', canvas: { width: 2400, height: 1350 } },
        { id: 'b', layer: '2', canvas: { width: 2400, height: 1350 } },
      ],
    });
    const next = resizeCutCanvas(base, 0, { width: 3000, height: 1350 }, frame);
    expect(next.cuts[0].rows.every((r) => r.canvas.width === 3000 && r.canvas.height === 1350)).toBe(true);
    expect(next.cuts[0].cameraWork?.scale?.in).toBeCloseTo(1.25, 5);
  });
  it('元プロジェクトを変更しない', () => {
    const base = projectWith(cut({ w: 2400, h: 1350 }));
    resizeCutCanvas(base, 0, { width: 1000, height: 1000 }, frame);
    expect(base.cuts[0].rows[0].canvas).toEqual({ width: 2400, height: 1350 });
  });
});

const layerCut = (psd: string, w: number, h: number, dialogue: string, time: number, layers = 1): ProjectCut => ({
  id: psd,
  psd,
  time,
  rows: Array.from({ length: layers }, (_, i) => ({
    id: `${psd}-r${i}`,
    layer: String(i + 1),
    dialogue: i === 0 ? dialogue : '',
    canvas: { width: w, height: h },
  })),
});

describe('mergeCuts', () => {
  it('下CUTのレイヤーを上CUTに連結し TIME を合算、DIALOGUE は上CUTを採用', () => {
    const base = projectWith(
      layerCut('c001.psd', 2400, 1350, 'A台詞', 100),
      layerCut('c002.psd', 2400, 1350, 'B台詞', 60),
      layerCut('c003.psd', 2400, 1350, 'C台詞', 30),
    );
    const next = mergeCuts(base, 0);
    expect(next.cuts).toHaveLength(2);
    expect(next.cuts[0].psd).toBe('c001.psd');
    expect(next.cuts[0].time).toBe(160);
    expect(next.cuts[0].rows).toHaveLength(2);
    expect(next.cuts[0].rows[0].dialogue).toBe('A台詞');
    expect(next.cuts[0].rows[1].dialogue).toBe('');
    expect(next.cuts[1].psd).toBe('c003.psd');
  });
  it('末尾CUTでは何もしない', () => {
    const base = projectWith(layerCut('c001.psd', 100, 50, 'x', 10));
    expect(mergeCuts(base, 0)).toBe(base);
  });
});

describe('splitLastLayer', () => {
  it('複数レイヤーCUTの最終レイヤーを新規CUTとして直後に切り出す', () => {
    const base = projectWith(layerCut('c001.psd', 2400, 1350, 'A台詞', 100, 2));
    const next = splitLastLayer(base, 0, 'c009.psd', 72);
    expect(next.cuts).toHaveLength(2);
    expect(next.cuts[0].rows).toHaveLength(1);
    expect(next.cuts[1].psd).toBe('c009.psd');
    expect(next.cuts[1].time).toBe(72);
    expect(next.cuts[1].rows[0].canvas).toEqual({ width: 2400, height: 1350 });
  });
  it('レイヤーが1枚なら何もしない', () => {
    const base = projectWith(layerCut('c001.psd', 100, 50, 'x', 10, 1));
    expect(splitLastLayer(base, 0, 'c009.psd', 72)).toBe(base);
  });
});
