import { describe, it, expect } from 'vitest';
import { upsertRecent, removeRecent, RECENTS_CAP } from './recents';
import type { RecentProject } from './recents';

const r = (id: string, ts: number): RecentProject => ({ id, name: id, timestamp: ts });

describe('upsertRecent', () => {
  it('新規は先頭に追加', () => {
    expect(upsertRecent([r('a', 1)], r('b', 2)).map((x) => x.id)).toEqual(['b', 'a']);
  });
  it('既存 id は先頭へ繰り上げ・重複しない', () => {
    const out = upsertRecent([r('a', 1), r('b', 2)], r('a', 3));
    expect(out.map((x) => x.id)).toEqual(['a', 'b']);
    expect(out.length).toBe(2);
    expect(out[0].timestamp).toBe(3);
  });
  it('cap を超えたら古いものを落とす', () => {
    let list: RecentProject[] = [];
    for (let i = 0; i < RECENTS_CAP + 3; i++) list = upsertRecent(list, r(`id${i}`, i));
    expect(list.length).toBe(RECENTS_CAP);
    expect(list[0].id).toBe(`id${RECENTS_CAP + 2}`);
    expect(list.some((x) => x.id === 'id0')).toBe(false);
  });
});

describe('removeRecent', () => {
  it('指定 id を除去', () => {
    expect(removeRecent([r('a', 1), r('b', 2)], 'a').map((x) => x.id)).toEqual(['b']);
  });
});
