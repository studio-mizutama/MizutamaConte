import { describe, expect, it } from 'vitest';
import { reconcileDisplayCuts, deriveDisplayCut } from '../displayCut';
import { ProjectCut, PsdCache } from '../types';

const makeCut = (id: string, dialogue = ''): ProjectCut => ({
  id,
  psd: `${id}.psd`,
  time: 72,
  rows: [{ id: `${id}r1`, layer: '1', dialogue, canvas: { width: 100, height: 100 } }],
});

describe('reconcileDisplayCuts', () => {
  it('変化のないカットは前回と同一の表示オブジェクト参照を返す', () => {
    const a = makeCut('c001');
    const b = makeCut('c002');
    const psdCache: PsdCache = {};
    const first = reconcileDisplayCuts([a, b], psdCache, new Map());
    const second = reconcileDisplayCuts([a, b], psdCache, first.cache);
    expect(second.list[0]).toBe(first.list[0]);
    expect(second.list[1]).toBe(first.list[1]);
  });

  it('変化したカットだけ新しい表示オブジェクトを返す', () => {
    const a = makeCut('c001');
    const b = makeCut('c002');
    const first = reconcileDisplayCuts([a, b], {}, new Map());
    const a2 = { ...a, time: 99 };
    const second = reconcileDisplayCuts([a2, b], {}, first.cache);
    expect(second.list[0]).not.toBe(first.list[0]);
    expect(second.list[1]).toBe(first.list[1]);
  });

  it('deriveDisplayCut は行 dialogue を結合する', () => {
    const cut: ProjectCut = {
      id: 'x',
      psd: 'x.psd',
      time: 1,
      rows: [
        { id: 'r1', layer: '1', dialogue: 'あ', canvas: { width: 1, height: 1 } },
        { id: 'r2', layer: '2', dialogue: 'い', canvas: { width: 1, height: 1 } },
      ],
    };
    expect(deriveDisplayCut(cut, undefined).dialogue).toBe('あい');
  });
});
