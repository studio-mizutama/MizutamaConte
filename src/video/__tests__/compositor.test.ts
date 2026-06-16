import { describe, it, expect, vi } from 'vitest';
import { compositeFrame } from '../compositor';
import type { ActiveCutState } from '../../project/frameState';

interface Op {
  type: string;
  alpha: number;
  src?: string;
}
const makeCanvas = (tag: string, width = 100, height = 100) => {
  const ops: Op[] = [];
  const ctx = {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
    fillStyle: '',
    fillRect: vi.fn(function (this: { globalAlpha: number }) {
      ops.push({ type: 'fillRect', alpha: this.globalAlpha });
    }),
    clearRect: vi.fn(),
    drawImage: vi.fn(function (this: { globalAlpha: number }, src: { __tag?: string }) {
      ops.push({ type: 'drawImage', alpha: this.globalAlpha, src: src?.__tag ?? 'layer' });
    }),
  };
  const canvas = { __tag: tag, width, height, getContext: () => ctx };
  return { canvas, ctx, ops };
};
const fakeLayer = () => ({}) as unknown as HTMLCanvasElement;

const flatCut = (): Cut =>
  ({
    time: 24,
    picture: {
      width: 100,
      height: 100,
      children: [
        { name: 'bg', canvas: fakeLayer() },
        { name: 'l', canvas: fakeLayer() },
      ],
    },
  }) as unknown as Cut;

const state = (over: Partial<ActiveCutState> = {}): ActiveCutState => ({
  cutIndex: 0,
  unitIndex: 0,
  scale: 1,
  posX: 0,
  posY: 0,
  divOpacity: 1,
  canvasOpacity: 1,
  ...over,
});

describe('compositeFrame (frameModel + 3バッファ)', () => {
  it('null state は out を黒で塗って return（scratch には触れない）', () => {
    const out = makeCanvas('out');
    const scratch = makeCanvas('scratch');
    const fb = makeCanvas('fb');
    const us = makeCanvas('us');
    compositeFrame(null, [flatCut()], { width: 100, height: 100 }, out.canvas as never, scratch.canvas as never, fb.canvas as never, us.canvas as never);
    expect(out.ops.some((o) => o.type === 'fillRect')).toBe(true); // 黒塗り
    expect(scratch.ops.length).toBe(0); // 早期 return
  });

  it('背景+ユニットを frameBuffer に平坦化し、白地→canvasOpacity→divOpacity の順で合成', () => {
    const out = makeCanvas('out');
    const scratch = makeCanvas('scratch');
    const fb = makeCanvas('fb');
    const us = makeCanvas('us');
    compositeFrame(
      state({ divOpacity: 0.5, canvasOpacity: 0.5 }),
      [flatCut()],
      { width: 100, height: 100 },
      out.canvas as never,
      scratch.canvas as never,
      fb.canvas as never,
      us.canvas as never,
    );
    // frameBuffer: 背景1 + 単独ユニット1 = drawImage 2回（いずれも素材 canvas）
    const fbDraws = fb.ops.filter((o) => o.type === 'drawImage');
    expect(fbDraws.length).toBe(2);
    // scratch: 白 fillRect + frameBuffer を canvasOpacity(0.5) で描画
    expect(scratch.ops.some((o) => o.type === 'fillRect')).toBe(true);
    const scDraw = scratch.ops.find((o) => o.type === 'drawImage' && o.src === 'fb');
    expect(scDraw?.alpha).toBeCloseTo(0.5, 6);
    // out: 黒 fillRect + scratch を divOpacity(0.5) で描画
    const outDraw = out.ops.find((o) => o.type === 'drawImage' && o.src === 'scratch');
    expect(outDraw?.alpha).toBeCloseTo(0.5, 6);
  });
});
