import { describe, it, expect } from 'vitest';
import { crossOverlap, cutOffsets, totalFrames, currentCutIndex, cutNav } from '../cutOffsets';

// A=48f（fadeOut Cross 12）/ B=36f（fadeIn Cross 12）→ 重なり 12・total 72
const cross = (): Cut[] => [
  { time: 48, action: { fadeOut: 'Cross', fadeOutDuration: 12 } },
  { time: 36, action: { fadeIn: 'Cross', fadeInDuration: 12 } },
];
// クロス解除（同尺・同カット数）→ 重なり 0・total 84
const noCross = (): Cut[] => [{ time: 48 }, { time: 36 }];
// 連続クロス: A20(out12) / B24(in12,out12) / C20(in12)
const tripleCross = (): Cut[] => [
  { time: 20, action: { fadeOut: 'Cross', fadeOutDuration: 12 } },
  { time: 24, action: { fadeIn: 'Cross', fadeInDuration: 12, fadeOut: 'Cross', fadeOutDuration: 12 } },
  { time: 20, action: { fadeIn: 'Cross', fadeInDuration: 12 } },
];

describe('crossOverlap', () => {
  it('Cross ペア成立で fadeOutDuration を返す', () => {
    expect(crossOverlap(cross(), 0)).toBe(12);
  });
  it('片側だけ Cross なら 0（後カット fadeIn が非 Cross）', () => {
    const cuts: Cut[] = [{ time: 48, action: { fadeOut: 'Cross', fadeOutDuration: 12 } }, { time: 36 }];
    expect(crossOverlap(cuts, 0)).toBe(0);
  });
  it('両尺の min でクランプ（重なりがカット尺を超えない）', () => {
    const cuts: Cut[] = [
      { time: 48, action: { fadeOut: 'Cross', fadeOutDuration: 40 } },
      { time: 30, action: { fadeIn: 'Cross', fadeInDuration: 40 } },
    ];
    expect(crossOverlap(cuts, 0)).toBe(30); // min(40, 48, 30)
  });
  it('範囲外 index は 0', () => {
    expect(crossOverlap(cross(), 1)).toBe(0); // 末尾＝相方なし
    expect(crossOverlap(cross(), 9)).toBe(0);
  });
});

describe('cutOffsets', () => {
  it('クロスで重なり 12 を反映: A[0,48]・B[36,72]', () => {
    expect(cutOffsets(cross())).toEqual([{ start: 0, end: 48 }, { start: 36, end: 72 }]);
  });
  it('クロス解除で完全可逆: A[0,48]・B[48,84]', () => {
    expect(cutOffsets(noCross())).toEqual([{ start: 0, end: 48 }, { start: 48, end: 84 }]);
  });
  it('各 span 長は常にカット自身の尺（HUD 右上−左上 = cut.time）', () => {
    const spans = cutOffsets(cross());
    expect(spans[0].end - spans[0].start).toBe(48);
    expect(spans[1].end - spans[1].start).toBe(36);
  });
  it('連続クロスで start は単調非減少（順序逆転しない）', () => {
    const spans = cutOffsets(tripleCross());
    expect(spans.map((s) => s.start)).toEqual([0, 8, 20]);
    expect(spans[0].start).toBeLessThanOrEqual(spans[1].start);
    expect(spans[1].start).toBeLessThanOrEqual(spans[2].start);
  });
  it('空配列は []', () => {
    expect(cutOffsets([])).toEqual([]);
  });
  it('単一カットは [0, time]', () => {
    expect(cutOffsets([{ time: 24 }])).toEqual([{ start: 0, end: 24 }]);
  });
});

describe('totalFrames', () => {
  it('クロスは 48+36−12 = 72', () => expect(totalFrames(cross())).toBe(72));
  it('クロス解除は 48+36 = 84', () => expect(totalFrames(noCross())).toBe(84));
  it('空配列は 0', () => expect(totalFrames([])).toBe(0));
  it('単一は自身の尺', () => expect(totalFrames([{ time: 24 }])).toBe(24));
});

describe('currentCutIndex（choice B = 最後発）', () => {
  it('重なり区間 frame=42 は後発カット B', () => expect(currentCutIndex(42, cross())).toBe(1));
  it('重なり開始 frame=36 も後発カット B', () => expect(currentCutIndex(36, cross())).toBe(1));
  it('重なり手前 frame=20 は A', () => expect(currentCutIndex(20, cross())).toBe(0));
  it('先頭 frame=0 は A', () => expect(currentCutIndex(0, cross())).toBe(0));
  it('B 単独区間 frame=60 は B', () => expect(currentCutIndex(60, cross())).toBe(1));
  it('総尺以上 frame=72 は null', () => expect(currentCutIndex(72, cross())).toBeNull());
});

describe('cutNav（HUD + カット送り）', () => {
  it('空配列はゼロ', () => {
    expect(cutNav(0, [])).toEqual({ index: 0, start: 0, hudEnd: 0, prevStart: 0, nextStart: 0 });
  });
  it('A 区間 frame=20: 次送りは B の開始(36=重なり開始)へ', () => {
    expect(cutNav(20, cross())).toEqual({ index: 0, start: 0, hudEnd: 48, prevStart: 0, nextStart: 36 });
  });
  it('重なり区間 frame=42: current は B・前送りは A 開始・次送りは総尺', () => {
    expect(cutNav(42, cross())).toEqual({ index: 1, start: 36, hudEnd: 72, prevStart: 0, nextStart: 72 });
  });
  it('HUD 不変: hudEnd − start = カット自身の尺', () => {
    const n0 = cutNav(20, cross());
    expect(n0.hudEnd - n0.start).toBe(48);
    const n1 = cutNav(42, cross());
    expect(n1.hudEnd - n1.start).toBe(36);
  });
});
