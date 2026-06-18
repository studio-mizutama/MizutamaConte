import { describe, it, expect } from 'vitest';
import {
  targetPsdName,
  reorderCut,
  reorderScene,
  planReorderRename,
  remapPsdCache,
  RenameOp,
} from '../reorder';
import { deriveScenes } from '../scene';
import { ProjectFile, ProjectCut } from '../types';

const cut = (id: string, psd?: string, sceneStart?: { title?: string }): ProjectCut => ({
  id,
  psd,
  sceneStart,
  time: 24,
  rows: [{ id: id + 'r', layer: '1', dialogue: '', canvas: { width: 100, height: 100 } }],
});

const project = (cuts: ProjectCut[]): ProjectFile => ({
  version: 2,
  title: 'T',
  settings: { aspect: '16:9', resolution: 'FHD', frame: { width: 1920, height: 1080 }, fps: 24 },
  cuts,
});

describe('targetPsdName', () => {
  it('0 始まり index を 1 始まり 3 桁ゼロ詰めの c{NNN}.psd にする', () => {
    expect(targetPsdName(0)).toBe('c001.psd');
    expect(targetPsdName(2)).toBe('c003.psd');
    expect(targetPsdName(11)).toBe('c012.psd');
  });
});

describe('reorderCut', () => {
  it('cuts を from→to へ移動する（前方へ）', () => {
    const p = project([cut('a'), cut('b'), cut('c')]);
    const next = reorderCut(p, 2, 0); // c を先頭へ
    expect(next.cuts.map((c) => c.id)).toEqual(['c', 'a', 'b']);
  });
  it('cuts を from→to へ移動する（後方へ）', () => {
    const p = project([cut('a'), cut('b'), cut('c')]);
    const next = reorderCut(p, 0, 2); // a を末尾へ
    expect(next.cuts.map((c) => c.id)).toEqual(['b', 'c', 'a']);
  });
  it('from === to なら順序は不変', () => {
    const p = project([cut('a'), cut('b'), cut('c')]);
    expect(reorderCut(p, 1, 1).cuts.map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });
  it('元 project を破壊しない（イミュータブル）', () => {
    const p = project([cut('a'), cut('b'), cut('c')]);
    reorderCut(p, 2, 0);
    expect(p.cuts.map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });

  /** deriveScenes 結果を「期待ブロック順」と突き合わせる検証ヘルパー（reorderCut 用）。
   *  expected は各シーンの { title, ids } をブロック順に並べたもの。 */
  const expectCutScenes = (
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

  describe('deriveScenes round-trip（sceneStart マーカー正規化 / ドロップ先シーンに合流）', () => {
    // 検証トレースの基準構成: S1=[a] | S2=[b,c] | S3=[d]
    const traceProject = (): ProjectFile =>
      project([
        cut('a'),
        cut('b', undefined, { title: 'S2' }),
        cut('c'),
        cut('d', undefined, { title: 'S3' }),
      ]);

    it('CUT を末尾へ移すとドロップ先シーンに合流し、元シーンは残存 CUT が見出しを継承する', () => {
      // b(S2 先頭) を d の後＝末尾へ。期待: S1:[a] | S2:[c] | S3:[d,b]
      const next = reorderCut(traceProject(), 1, 3);
      expect(next.cuts.map((c) => c.id)).toEqual(['a', 'c', 'd', 'b']);
      expectCutScenes(next.cuts, [
        { title: undefined, ids: ['a'] },
        { title: 'S2', ids: ['c'] },
        { title: 'S3', ids: ['d', 'b'] },
      ]);
    });

    it('CUT を index0 へ移すと暗黙 Scene 1 に合流する', () => {
      // b を先頭へ。期待: S1:[b,a] | S2:[c] | S3:[d]
      const next = reorderCut(traceProject(), 1, 0);
      expect(next.cuts.map((c) => c.id)).toEqual(['b', 'a', 'c', 'd']);
      // index0 は常に暗黙（マーカー無し）
      expect(next.cuts[0].sceneStart).toBeUndefined();
      expectCutScenes(next.cuts, [
        { title: undefined, ids: ['b', 'a'] },
        { title: 'S2', ids: ['c'] },
        { title: 'S3', ids: ['d'] },
      ]);
    });

    it('シーン内の移動（前後を同シーン CUT に挟まれる）ではシーン構造が変わらない', () => {
      // S1=[a] | S2=[b,c,d] | S3=[e]。S2 内で d を c の前へ（index3 → index2）
      const p = project([
        cut('a'),
        cut('b', undefined, { title: 'S2' }),
        cut('c'),
        cut('d'),
        cut('e', undefined, { title: 'S3' }),
      ]);
      const next = reorderCut(p, 3, 2);
      expect(next.cuts.map((c) => c.id)).toEqual(['a', 'b', 'd', 'c', 'e']);
      // d は前後とも S2 の CUT に挟まれるため S2 に留まる。シーン構造不変
      expectCutScenes(next.cuts, [
        { title: undefined, ids: ['a'] },
        { title: 'S2', ids: ['b', 'd', 'c'] },
        { title: 'S3', ids: ['e'] },
      ]);
    });

    it('CUT を別シーンの先頭直後へ落とすとそのシーンに合流する（ドロップ先合流）', () => {
      // S1=[a] | S2=[b,c] | S3=[d]。c(S2) を a の直後（index1）へ落とす → c は S1 に合流
      const next = reorderCut(traceProject(), 2, 1);
      expect(next.cuts.map((c) => c.id)).toEqual(['a', 'c', 'b', 'd']);
      // c は落とした位置のシーン（S1）に合流。元 S2 は b が見出しを継承
      expectCutScenes(next.cuts, [
        { title: undefined, ids: ['a', 'c'] },
        { title: 'S2', ids: ['b'] },
        { title: 'S3', ids: ['d'] },
      ]);
    });

    it('境界をまたぐ移動でもシーン数が保たれる', () => {
      const next = reorderCut(traceProject(), 1, 3);
      expect(deriveScenes(next.cuts).length).toBe(3);
    });

    it('移動した CUT のシーンタイトルが残存 CUT に継承される（c が S2 見出しを継承）', () => {
      const next = reorderCut(traceProject(), 1, 3);
      const scenes = deriveScenes(next.cuts);
      const s2 = scenes.find((s) => s.title === 'S2');
      expect(s2?.cutIndices.map((idx) => next.cuts[idx].id)).toEqual(['c']);
    });

    it('index0 へ来た CUT には sceneStart マーカーが付かない（暗黙化）', () => {
      // タイトル付きシーンの先頭 d を index0 へ移動しても暗黙化する
      const next = reorderCut(traceProject(), 3, 0);
      expect(next.cuts[0].id).toBe('d');
      expect(next.cuts[0].sceneStart).toBeUndefined();
    });

    it('from === to なら完全に不変（マーカーも保持）', () => {
      const next = reorderCut(traceProject(), 1, 1);
      expect(next.cuts.map((c) => c.id)).toEqual(['a', 'b', 'c', 'd']);
      expect(next.cuts[1].sceneStart).toEqual({ title: 'S2' });
      expect(next.cuts[3].sceneStart).toEqual({ title: 'S3' });
      expectCutScenes(next.cuts, [
        { title: undefined, ids: ['a'] },
        { title: 'S2', ids: ['b', 'c'] },
        { title: 'S3', ids: ['d'] },
      ]);
    });

    it('内部 cut に余計な sceneStart マーカーを残さない', () => {
      const next = reorderCut(traceProject(), 1, 3);
      // S3 の内部 cut（b）にはマーカーが無く、d だけが境界を担う
      const b = next.cuts.find((c) => c.id === 'b');
      expect(b?.sceneStart).toBeUndefined();
    });

    it('元 project を破壊しない（マーカー正規化後もイミュータブル）', () => {
      const p = traceProject();
      reorderCut(p, 1, 3);
      expect(p.cuts.map((c) => c.id)).toEqual(['a', 'b', 'c', 'd']);
      expect(p.cuts[1].sceneStart).toEqual({ title: 'S2' });
      expect(p.cuts[3].sceneStart).toEqual({ title: 'S3' });
    });
  });
});

describe('reorderScene', () => {
  it('連続 CUT ブロック（シーン）を丸ごと移動する', () => {
    // Scene1=[a], Scene2=[b,c], Scene3=[d]
    const p = project([
      cut('a'),
      cut('b', undefined, { title: 'S2' }),
      cut('c'),
      cut('d', undefined, { title: 'S3' }),
    ]);
    const next = reorderScene(p, 1, 0); // Scene2 ブロックを先頭へ
    expect(next.cuts.map((c) => c.id)).toEqual(['b', 'c', 'a', 'd']);
  });
  it('シーンを後方へ移動する', () => {
    const p = project([
      cut('a'),
      cut('b', undefined, { title: 'S2' }),
      cut('c'),
      cut('d', undefined, { title: 'S3' }),
    ]);
    const next = reorderScene(p, 0, 2); // Scene1=[a] を末尾シーンの後へ
    expect(next.cuts.map((c) => c.id)).toEqual(['b', 'c', 'd', 'a']);
  });
  it('fromScene === toScene なら順序は不変', () => {
    const p = project([cut('a'), cut('b', undefined, { title: 'S2' }), cut('c')]);
    expect(reorderScene(p, 1, 1).cuts.map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });
  it('元 project を破壊しない（イミュータブル）', () => {
    const p = project([cut('a'), cut('b', undefined, { title: 'S2' }), cut('c')]);
    reorderScene(p, 1, 0);
    expect(p.cuts.map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });

  /** deriveScenes 結果を「期待ブロック順」と突き合わせる検証ヘルパー。
   *  expected は各シーンの { title, ids } をブロック順に並べたもの。 */
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

  describe('deriveScenes round-trip（sceneStart マーカー正規化）', () => {
    it('暗黙の第1シーンを末尾へ後方移動してもシーンが消失しない', () => {
      // S1=[c0]（暗黙・マーカー無）, S2=[c1,c2], S3=[c3]
      const p = project([
        cut('c0'),
        cut('c1', undefined, { title: 'S2' }),
        cut('c2'),
        cut('c3', undefined, { title: 'S3' }),
      ]);
      const next = reorderScene(p, 0, 2); // S1 ブロックを末尾へ
      // ブロック順: S2 | S3 | 旧S1。cut.id 順序は既存テスト通り維持
      expect(next.cuts.map((c) => c.id)).toEqual(['c1', 'c2', 'c3', 'c0']);
      // 3 シーンが保たれること（c0 が S3 に吸収されない）
      expectScenes(next.cuts, [
        { title: 'S2', ids: ['c1', 'c2'] },
        { title: 'S3', ids: ['c3'] },
        { title: undefined, ids: ['c0'] },
      ]);
    });

    it('タイトル付きシーンを先頭へ前方移動すると title が保全される', () => {
      // S1=[c0]（暗黙・無題）, S2=[c1,c2], S3=[c3]
      const p = project([
        cut('c0'),
        cut('c1', undefined, { title: 'S2' }),
        cut('c2'),
        cut('c3', undefined, { title: 'S3' }),
      ]);
      const next = reorderScene(p, 1, 0); // S2 を先頭へ
      expect(next.cuts.map((c) => c.id)).toEqual(['c1', 'c2', 'c0', 'c3']);
      // 先頭ブロックは title 'S2' を保全し deriveScenes が拾う。
      // 旧S1（無題）は order>0 へ移ったのでマーカー付与され境界化する
      expectScenes(next.cuts, [
        { title: 'S2', ids: ['c1', 'c2'] },
        { title: undefined, ids: ['c0'] },
        { title: 'S3', ids: ['c3'] },
      ]);
      // 先頭 cut に sceneStart:{title} が乗っていること
      expect(next.cuts[0].sceneStart).toEqual({ title: 'S2' });
    });

    it('暗黙の第1シーンを後方移動するとタイトル付きシーンが先頭で title を保つ', () => {
      const p = project([
        cut('c0'),
        cut('c1', undefined, { title: 'S2' }),
        cut('c2'),
        cut('c3', undefined, { title: 'S3' }),
      ]);
      const next = reorderScene(p, 0, 1); // S1 を S2 の後へ
      expect(next.cuts.map((c) => c.id)).toEqual(['c1', 'c2', 'c0', 'c3']);
      expectScenes(next.cuts, [
        { title: 'S2', ids: ['c1', 'c2'] },
        { title: undefined, ids: ['c0'] },
        { title: 'S3', ids: ['c3'] },
      ]);
    });

    it('先頭へ来た無題シーンは sceneStart マーカーが除去され暗黙化する', () => {
      // S1=[c0]（タイトル付き）, S2=[c1]（無題マーカー）...という構成を作るため
      // 先頭にタイトル付きシーンを置く
      const p = project([
        cut('c0', undefined, { title: 'Opening' }),
        cut('c1', undefined, { title: undefined }),
        cut('c2', undefined, { title: 'S3' }),
      ]);
      // 無題の S2 を先頭へ移動
      const next = reorderScene(p, 1, 0);
      expect(next.cuts.map((c) => c.id)).toEqual(['c1', 'c0', 'c2']);
      // 先頭ブロックは無題なので sceneStart 除去（暗黙の Scene 1）
      expect(next.cuts[0].sceneStart).toBeUndefined();
      expectScenes(next.cuts, [
        { title: undefined, ids: ['c1'] },
        { title: 'Opening', ids: ['c0'] },
        { title: 'S3', ids: ['c2'] },
      ]);
    });

    it('内部 cut の sceneStart は除去される（重複境界を作らない）', () => {
      const p = project([
        cut('c0'),
        cut('c1', undefined, { title: 'S2' }),
        cut('c2'),
        cut('c3', undefined, { title: 'S3' }),
      ]);
      const next = reorderScene(p, 0, 2);
      // 末尾へ移った旧S1 内部に余計なマーカーが無いこと（単独 cut なので内部 cut は無いが、
      // S2 ブロックの内部 cut c2 にマーカーが付いていないことを確認）
      const c2 = next.cuts.find((c) => c.id === 'c2');
      expect(c2?.sceneStart).toBeUndefined();
    });
  });
});

describe('planReorderRename', () => {
  it('c001↔c003 入替で 2 つの rename を出す（衝突ケース）', () => {
    // 既に並べ替え済み: index0=c003.psd, index1=c002.psd, index2=c001.psd
    const p = project([cut('z', 'c003.psd'), cut('y', 'c002.psd'), cut('x', 'c001.psd')]);
    const { renames, cuts } = planReorderRename(p);
    // index0→c001, index1→c002(不変→対象外), index2→c003
    expect(renames).toEqual<RenameOp[]>([
      { from: 'c003.psd', to: 'c001.psd' },
      { from: 'c001.psd', to: 'c003.psd' },
    ]);
    expect(cuts.map((c) => c.psd)).toEqual(['c001.psd', 'c002.psd', 'c003.psd']);
  });
  it('from === to は renames に積まない（位置不変の cut）', () => {
    const p = project([cut('a', 'c001.psd'), cut('b', 'c002.psd')]);
    const { renames, cuts } = planReorderRename(p);
    expect(renames).toEqual([]);
    expect(cuts.map((c) => c.psd)).toEqual(['c001.psd', 'c002.psd']);
  });
  it('psd を持たない cut はその番号を欠番化し、後続の番号付与を進める', () => {
    // index0=psd 無し, index1=c001.psd, index2=c002.psd
    // → index1 の目標は c002.psd（=index+1）、index2 の目標は c003.psd
    const p = project([cut('a'), cut('b', 'c001.psd'), cut('c', 'c002.psd')]);
    const { renames, cuts } = planReorderRename(p);
    expect(renames).toEqual<RenameOp[]>([
      { from: 'c001.psd', to: 'c002.psd' },
      { from: 'c002.psd', to: 'c003.psd' },
    ]);
    // psd 無し cut は psd: undefined のまま
    expect(cuts.map((c) => c.psd)).toEqual([undefined, 'c002.psd', 'c003.psd']);
  });
  it('元 project の cuts を破壊しない（イミュータブル）', () => {
    const p = project([cut('z', 'c003.psd'), cut('x', 'c001.psd')]);
    planReorderRename(p);
    expect(p.cuts.map((c) => c.psd)).toEqual(['c003.psd', 'c001.psd']);
  });
});

describe('remapPsdCache', () => {
  it('renames に従ってキーを旧名→新名へ張り替える', () => {
    const cache = { 'c003.psd': 'A', 'c001.psd': 'B', 'c002.psd': 'C' };
    const renames: RenameOp[] = [
      { from: 'c003.psd', to: 'c001.psd' },
      { from: 'c001.psd', to: 'c003.psd' },
    ];
    const next = remapPsdCache(cache, renames);
    expect(next).toEqual({ 'c001.psd': 'A', 'c003.psd': 'B', 'c002.psd': 'C' });
  });
  it('renames が空ならキー集合は不変（値も保持）', () => {
    const cache = { 'c001.psd': 'B', 'c002.psd': 'C' };
    expect(remapPsdCache(cache, [])).toEqual({ 'c001.psd': 'B', 'c002.psd': 'C' });
  });
  it('rename 対象外のキーはそのまま残す', () => {
    const cache = { 'c001.psd': 'A', 'c002.psd': 'B' };
    const renames: RenameOp[] = [{ from: 'c001.psd', to: 'c003.psd' }];
    expect(remapPsdCache(cache, renames)).toEqual({ 'c003.psd': 'A', 'c002.psd': 'B' });
  });
  it('元 cache を破壊しない（イミュータブル）', () => {
    const cache = { 'c001.psd': 'A' };
    remapPsdCache(cache, [{ from: 'c001.psd', to: 'c002.psd' }]);
    expect(cache).toEqual({ 'c001.psd': 'A' });
  });
});
