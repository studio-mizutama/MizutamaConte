import { describe, it, expect } from 'vitest';
import {
  targetPsdName,
  reorderCut,
  reorderScene,
  planReorderRename,
  remapPsdCache,
  RenameOp,
} from '../reorder';
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
