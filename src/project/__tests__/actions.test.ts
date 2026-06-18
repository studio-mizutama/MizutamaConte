import { describe, it, expect } from 'vitest';
import { deleteCutAt, insertCutAfter, mergeCuts, orphanedPsdAfterMerge, resizeCutCanvas, splitLastLayer } from '../actions';
import { deriveScenes } from '../scene';
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

const cutSized = (id: string, width: number, height: number): ProjectCut => ({
  id,
  psd: 'c001.psd',
  time: 24,
  rows: [{ id: id + 'r', layer: '1', dialogue: '', canvas: { width, height } }],
});

describe('resizeCutCanvas', () => {
  const frame = { width: 1920, height: 1080 };

  it('拡大時は cover カメラを自動付与する', () => {
    const p = project([cutSized('a', 1920, 1080)]);
    const resized = resizeCutCanvas(p, 0, { width: 2880, height: 1080 }, frame);
    // 全レイヤーが新サイズに揃う（不変条件）
    expect(resized.cuts[0].rows[0].canvas).toEqual({ width: 2880, height: 1080 });
    // 横のみ拡大 -> 左右パンの cameraWork が入る
    expect(resized.cuts[0].cameraWork).toBeDefined();
    expect(resized.cuts[0].cameraWork!.position!.in).toEqual({ x: -0.5, y: 0 });
    expect(resized.cuts[0].cameraWork!.position!.out).toEqual({ x: 0.5, y: 0 });
  });

  it('native（フレーム以下）に戻すと cameraWork を消す', () => {
    // いったん拡大カメラを持つ cut を native サイズへ戻す
    const enlarged = resizeCutCanvas(project([cutSized('a', 1920, 1080)]), 0, { width: 2880, height: 1080 }, frame);
    const back = resizeCutCanvas(enlarged, 0, { width: 1920, height: 1080 }, frame);
    expect(back.cuts[0].rows[0].canvas).toEqual({ width: 1920, height: 1080 });
    expect(back.cuts[0].cameraWork).toBeUndefined();
  });

  it('フレーム未満（縮小）も native 扱いで cameraWork なし', () => {
    const p = project([cutSized('a', 1920, 1080)]);
    const resized = resizeCutCanvas(p, 0, { width: 1280, height: 720 }, frame);
    expect(resized.cuts[0].cameraWork).toBeUndefined();
  });

  it('対象 index 以外のカットは不変', () => {
    const p = project([cutSized('a', 1920, 1080), cutSized('b', 1920, 1080)]);
    const resized = resizeCutCanvas(p, 0, { width: 2880, height: 1080 }, frame);
    expect(resized.cuts[1]).toBe(p.cuts[1]);
  });
});

/** 複数レイヤー（id 指定で行数を制御）+ 任意 cameraWork を持つ CUT を作るヘルパー */
const multiLayerCut = (id: string, layers: number, cameraWork?: CameraWork): ProjectCut => ({
  id,
  psd: id + '.psd',
  time: 24,
  cameraWork,
  rows: Array.from({ length: layers }, (_, i) => ({
    id: `${id}r${i}`,
    layer: String(i + 1),
    dialogue: '',
    // 拡大 canvas を想定（cameraWork が意味を持つサイズ）
    canvas: { width: 2880, height: 1080 },
  })),
});

describe('splitLastLayer', () => {
  it('cameraWork を持つ複数レイヤーCUTを分離すると新CUTにも cameraWork が乗る', () => {
    const camera: CameraWork = {
      position: { in: { x: -0.5, y: 0 }, out: { x: 0.5, y: 0 } },
    };
    const p = project([multiLayerCut('a', 2, camera)]);
    const split = splitLastLayer(p, 0, 'c002.psd', 24);
    expect(split.cuts).toHaveLength(2);
    // 元CUTは cameraWork を維持
    expect(split.cuts[0].cameraWork).toEqual(camera);
    // 新CUTにも同じ cameraWork が引き継がれる（拡大 canvas なのにカメラ無し＝静止を防ぐ）
    expect(split.cuts[1].cameraWork).toEqual(camera);
    // 新CUTの canvas は元CUTと同一（不変条件）
    expect(split.cuts[1].rows[0].canvas).toEqual({ width: 2880, height: 1080 });
  });

  it('元CUTに cameraWork が無ければ新CUTも cameraWork 無し', () => {
    const p = project([multiLayerCut('a', 2)]);
    const split = splitLastLayer(p, 0, 'c002.psd', 24);
    expect(split.cuts[1].cameraWork).toBeUndefined();
  });

  it('単層CUT（rows < 2）は分離できず不変', () => {
    const p = project([multiLayerCut('a', 1)]);
    expect(splitLastLayer(p, 0, 'c002.psd', 24)).toBe(p);
  });
});

describe('insertCutAfter', () => {
  it('index 直後に新CUTをスプライス挿入する', () => {
    const p = project([cut('a', 'c001.psd'), cut('b', 'c002.psd')]);
    const next = insertCutAfter(p, 0, 'new.psd', { width: 200, height: 100 }, 72);
    expect(next.cuts).toHaveLength(3);
    // 挿入位置: a の直後
    expect(next.cuts.map((c) => c.psd)).toEqual(['c001.psd', 'new.psd', 'c002.psd']);
    const inserted = next.cuts[1];
    expect(inserted.time).toBe(72);
    expect(inserted.rows).toHaveLength(1);
    expect(inserted.rows[0].layer).toBe('1');
    expect(inserted.rows[0].canvas).toEqual({ width: 200, height: 100 });
    // id が採番されている（一意）
    expect(inserted.id).toBeTruthy();
    expect(inserted.id).not.toBe(inserted.rows[0].id);
  });

  it('末尾 index への挿入は末尾に追加する', () => {
    const p = project([cut('a', 'c001.psd'), cut('b', 'c002.psd')]);
    const next = insertCutAfter(p, 1, 'new.psd', { width: 200, height: 100 }, 72);
    expect(next.cuts.map((c) => c.psd)).toEqual(['c001.psd', 'c002.psd', 'new.psd']);
  });

  it('sceneStart を付けない（挿入位置のシーンに合流する）', () => {
    // S1=[a] | S2=[b,c]。S2 先頭 b の直後へ挿入 → S2 に合流（シーン構造不変）
    const p = project([
      cutScene('a'),
      cutScene('b', { title: 'S2' }),
      cutScene('c'),
    ]);
    const next = insertCutAfter(p, 1, 'new.psd', { width: 200, height: 100 }, 72);
    expect(next.cuts[2].sceneStart).toBeUndefined();
    // 挿入CUTの psd で位置を特定（id は自動採番のため）
    expect(next.cuts.map((c) => c.psd)).toEqual(['a.psd', 'b.psd', 'new.psd', 'c.psd']);
    const scenes = deriveScenes(next.cuts);
    expect(scenes).toHaveLength(2);
    expect(scenes[1].title).toBe('S2');
    // S2 = [b, 挿入CUT, c]（3 CUT がシーンに合流）
    expect(scenes[1].cutIndices.map((i) => next.cuts[i].psd)).toEqual(['b.psd', 'new.psd', 'c.psd']);
  });

  it('元 project を破壊しない（イミュータブル）', () => {
    const p = project([cut('a', 'c001.psd'), cut('b', 'c002.psd')]);
    insertCutAfter(p, 0, 'new.psd', { width: 200, height: 100 }, 72);
    expect(p.cuts.map((c) => c.psd)).toEqual(['c001.psd', 'c002.psd']);
  });
});

/** sceneStart 付与可能な軽量 cut（deriveScenes round-trip 用） */
const cutScene = (id: string, sceneStart?: { title?: string }): ProjectCut => ({
  id,
  psd: id + '.psd',
  sceneStart,
  time: 24,
  rows: [{ id: id + 'r', layer: '1', dialogue: '', canvas: { width: 100, height: 100 } }],
});

describe('deleteCutAt', () => {
  /** deriveScenes 結果を期待ブロック順と突き合わせる（reorder のテストと同形式） */
  const expectScenes = (
    cuts: ProjectCut[],
    expected: { title?: string; ids: string[] }[],
  ): void => {
    const scenes = deriveScenes(cuts);
    expect(scenes.length).toBe(expected.length);
    scenes.forEach((scene, i) => {
      expect(scene.title).toBe(expected[i].title);
      expect(scene.cutIndices.map((idx) => cuts[idx].id)).toEqual(expected[i].ids);
    });
  };

  it('最後の1CUTは削除できず不変', () => {
    const p = project([cutScene('a')]);
    expect(deleteCutAt(p, 0)).toBe(p);
  });

  it('通常の削除: 対象 CUT を除去しシーン構造を保つ', () => {
    // S1=[a] | S2=[b,c,d]。S2 内部の c を削除
    const p = project([
      cutScene('a'),
      cutScene('b', { title: 'S2' }),
      cutScene('c'),
      cutScene('d'),
    ]);
    const next = deleteCutAt(p, 2);
    expect(next.cuts.map((c) => c.id)).toEqual(['a', 'b', 'd']);
    expectScenes(next.cuts, [
      { title: undefined, ids: ['a'] },
      { title: 'S2', ids: ['b', 'd'] },
    ]);
  });

  it('シーン先頭CUTの削除: 次CUTがタイトルを継承しシーン存続', () => {
    // S1=[a] | S2=[b,c]。S2 先頭 b を削除 → c が S2 見出しを継承
    const p = project([
      cutScene('a'),
      cutScene('b', { title: 'S2' }),
      cutScene('c'),
    ]);
    const next = deleteCutAt(p, 1);
    expect(next.cuts.map((c) => c.id)).toEqual(['a', 'c']);
    expectScenes(next.cuts, [
      { title: undefined, ids: ['a'] },
      { title: 'S2', ids: ['c'] },
    ]);
  });

  it('単独シーンの先頭CUT削除: そのシーンは消滅する', () => {
    // S1=[a] | S2=[b] | S3=[c,d]。単独 S2 を削除 → シーンごと消える
    const p = project([
      cutScene('a'),
      cutScene('b', { title: 'S2' }),
      cutScene('c', { title: 'S3' }),
      cutScene('d'),
    ]);
    const next = deleteCutAt(p, 1);
    expect(next.cuts.map((c) => c.id)).toEqual(['a', 'c', 'd']);
    expectScenes(next.cuts, [
      { title: undefined, ids: ['a'] },
      { title: 'S3', ids: ['c', 'd'] },
    ]);
  });

  it('index0 の削除: 新 index0 は暗黙の Scene 1（マーカー除去）', () => {
    // S1=[a,b] | S2=[c]。index0 の a を削除 → b が新 index0 で暗黙化
    const p = project([
      cutScene('a'),
      cutScene('b'),
      cutScene('c', { title: 'S2' }),
    ]);
    const next = deleteCutAt(p, 0);
    expect(next.cuts.map((c) => c.id)).toEqual(['b', 'c']);
    expect(next.cuts[0].sceneStart).toBeUndefined();
    expectScenes(next.cuts, [
      { title: undefined, ids: ['b'] },
      { title: 'S2', ids: ['c'] },
    ]);
  });

  it('index0（タイトル付きシーン先頭）の削除: 次CUTがタイトルを継承し暗黙化', () => {
    // S1=[a,b]（a がタイトル付きでも index0 は暗黙）...実際は index0 は暗黙なので
    // S1=[a] | S2=[b,c]。index0 削除 → b が新 index0 で S2 タイトルは暗黙化して落ちる
    const p = project([
      cutScene('a'),
      cutScene('b', { title: 'S2' }),
      cutScene('c'),
    ]);
    const next = deleteCutAt(p, 0);
    expect(next.cuts.map((c) => c.id)).toEqual(['b', 'c']);
    // 新 index0（b）は暗黙化、元 S2 タイトルは index0 では保持されない
    expect(next.cuts[0].sceneStart).toBeUndefined();
    expectScenes(next.cuts, [{ title: undefined, ids: ['b', 'c'] }]);
  });

  it('元 project を破壊しない（イミュータブル）', () => {
    const p = project([cutScene('a'), cutScene('b', { title: 'S2' }), cutScene('c')]);
    deleteCutAt(p, 1);
    expect(p.cuts.map((c) => c.id)).toEqual(['a', 'b', 'c']);
    expect(p.cuts[1].sceneStart).toEqual({ title: 'S2' });
  });
});
