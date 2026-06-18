import { describe, expect, it } from 'vitest';
import { paginate, CutBlock } from '../paginate';

const block = (index: number, height: number, isSceneStart = false): CutBlock => ({ index, height, isSceneStart });

describe('paginate', () => {
  it('容量に収まる範囲で CUT を1ページに貪欲に詰める', () => {
    const pages = paginate([block(0, 300), block(1, 300), block(2, 300)], 1000);
    expect(pages).toHaveLength(1);
    expect(pages[0].cutIndices).toEqual([0, 1, 2]);
    expect(pages[0].pageNumber).toBe(1);
  });
  it('容量超過で次ページへ送る（CUTは分割しない）', () => {
    const pages = paginate([block(0, 600), block(1, 600)], 1000);
    expect(pages).toHaveLength(2);
    expect(pages[0].cutIndices).toEqual([0]);
    expect(pages[1].cutIndices).toEqual([1]);
    expect(pages[1].pageNumber).toBe(2);
  });
  it('シーン先頭は必ず新ページの先頭に来る', () => {
    const pages = paginate([block(0, 100), block(1, 100, true), block(2, 100)], 1000);
    expect(pages).toHaveLength(2);
    expect(pages[0].cutIndices).toEqual([0]);
    expect(pages[1].cutIndices).toEqual([1, 2]);
  });
  it('先頭 CUT が isSceneStart でも余計な空ページを作らない', () => {
    const pages = paginate([block(0, 100, true), block(1, 100)], 1000);
    expect(pages).toHaveLength(1);
    expect(pages[0].cutIndices).toEqual([0, 1]);
  });
  it('容量超の巨大 CUT は単独ページに置く（無限ループしない）', () => {
    const pages = paginate([block(0, 2000), block(1, 100)], 1000);
    expect(pages).toHaveLength(2);
    expect(pages[0].cutIndices).toEqual([0]);
    expect(pages[1].cutIndices).toEqual([1]);
  });
  it('全 index が漏れなく1回ずつ元順序で割り当てられる', () => {
    const blocks = [block(0, 400), block(1, 400), block(2, 400, true), block(3, 400)];
    const pages = paginate(blocks, 1000);
    const flat = pages.flatMap((p) => p.cutIndices);
    expect(flat).toEqual([0, 1, 2, 3]);
  });
  it('空入力は空配列', () => {
    expect(paginate([], 1000)).toEqual([]);
  });
});
