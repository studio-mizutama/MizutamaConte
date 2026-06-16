import { describe, it, expect } from 'vitest';
import { setFadeType, setFadeDuration } from './actions';

const proj = (times: number[]) => ({
  cuts: times.map((time, i) => ({ id: `c${i}`, time, rows: [], action: undefined as any })),
}) as any;

describe('setFadeType（fade 既定12 + Cross ペア）', () => {
  it('White In を選ぶと duration 既定 12', () => {
    const p = setFadeType(proj([100, 100]), 0, 'in', 'White In');
    expect(p.cuts[0].action!.fadeIn).toBe('White In');
    expect(p.cuts[0].action!.fadeInDuration).toBe(12);
  });
  it('既定12 は cut 尺で clamp', () => {
    const p = setFadeType(proj([8, 8]), 0, 'in', 'White In');
    expect(p.cuts[0].action!.fadeInDuration).toBe(8);
  });
  it('cut0 fadeOut=Cross で cut1 fadeIn も Cross（両 dur=12）', () => {
    const p = setFadeType(proj([100, 100]), 0, 'out', 'Cross');
    expect(p.cuts[0].action!.fadeOut).toBe('Cross');
    expect(p.cuts[1].action!.fadeIn).toBe('Cross');
    expect(p.cuts[0].action!.fadeOutDuration).toBe(12);
    expect(p.cuts[1].action!.fadeInDuration).toBe(12);
  });
  it('cut1 fadeIn=Cross で cut0 fadeOut も Cross（対称）', () => {
    const p = setFadeType(proj([100, 100]), 1, 'in', 'Cross');
    expect(p.cuts[0].action!.fadeOut).toBe('Cross');
    expect(p.cuts[1].action!.fadeIn).toBe('Cross');
  });
  it('Cross duration は両尺の min に clamp', () => {
    const p = setFadeType(proj([100, 6]), 0, 'out', 'Cross');
    expect(p.cuts[0].action!.fadeOutDuration).toBe(6);
    expect(p.cuts[1].action!.fadeInDuration).toBe(6);
  });
  it('片側を Cross 以外に変えると相方の Cross は None に戻る', () => {
    let p = setFadeType(proj([100, 100]), 0, 'out', 'Cross');
    p = setFadeType(p, 0, 'out', undefined);
    expect(p.cuts[0].action!.fadeOut).toBeUndefined();
    expect(p.cuts[1].action!.fadeIn).toBeUndefined();
  });
  it('片側を別種別に変えても相方 Cross は解消', () => {
    let p = setFadeType(proj([100, 100]), 0, 'out', 'Cross');
    p = setFadeType(p, 1, 'in', 'White In');
    expect(p.cuts[1].action!.fadeIn).toBe('White In');
    expect(p.cuts[0].action!.fadeOut).toBeUndefined();
  });
  it('末尾 cut fadeOut=Cross は no-op', () => {
    const p = setFadeType(proj([100, 100]), 1, 'out', 'Cross');
    expect(p.cuts[1].action?.fadeOut).toBeUndefined();
  });
  it('先頭 cut fadeIn=Cross は no-op', () => {
    const p = setFadeType(proj([100, 100]), 0, 'in', 'Cross');
    expect(p.cuts[0].action?.fadeIn).toBeUndefined();
  });
});

describe('setFadeDuration（Cross は両側追従）', () => {
  it('Cross の duration を変えると相方も同値', () => {
    let p = setFadeType(proj([100, 100]), 0, 'out', 'Cross');
    p = setFadeDuration(p, 0, 'out', 30);
    expect(p.cuts[0].action!.fadeOutDuration).toBe(30);
    expect(p.cuts[1].action!.fadeInDuration).toBe(30);
  });
  it('Cross duration も両尺 min で clamp', () => {
    let p = setFadeType(proj([100, 20]), 0, 'out', 'Cross');
    p = setFadeDuration(p, 0, 'out', 50);
    expect(p.cuts[0].action!.fadeOutDuration).toBe(20);
    expect(p.cuts[1].action!.fadeInDuration).toBe(20);
  });
  it('非 Cross の duration は単独・cut 尺で clamp', () => {
    let p = setFadeType(proj([10, 100]), 0, 'in', 'White In');
    p = setFadeDuration(p, 0, 'in', 999);
    expect(p.cuts[0].action!.fadeInDuration).toBe(10);
  });
});
