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
  it('空 states は out を黒で塗って return（scratch には触れない）', () => {
    const out = makeCanvas('out');
    const scratch = makeCanvas('scratch');
    const fb = makeCanvas('fb');
    const us = makeCanvas('us');
    compositeFrame([], [flatCut()], { width: 100, height: 100 }, out.canvas as never, scratch.canvas as never, fb.canvas as never, us.canvas as never);
    expect(out.ops.some((o) => o.type === 'fillRect')).toBe(true); // 黒塗り
    expect(scratch.ops.length).toBe(0); // 早期 return
  });

  it('単一 state: 背景+ユニットを frameBuffer に平坦化し、白地→canvasOpacity→divOpacity の順で合成', () => {
    const out = makeCanvas('out');
    const scratch = makeCanvas('scratch');
    const fb = makeCanvas('fb');
    const us = makeCanvas('us');
    compositeFrame(
      [state({ divOpacity: 0.5, canvasOpacity: 0.5 })],
      [flatCut()],
      { width: 100, height: 100 },
      out.canvas as never,
      scratch.canvas as never,
      fb.canvas as never,
      us.canvas as never,
    );
    const fbDraws = fb.ops.filter((o) => o.type === 'drawImage');
    expect(fbDraws.length).toBe(2); // 背景1 + 単独ユニット1
    expect(scratch.ops.some((o) => o.type === 'fillRect')).toBe(true); // 白地
    const scDraw = scratch.ops.find((o) => o.type === 'drawImage' && o.src === 'fb');
    expect(scDraw?.alpha).toBeCloseTo(0.5, 6); // canvasOpacity
    const outDraw = out.ops.find((o) => o.type === 'drawImage' && o.src === 'scratch');
    expect(outDraw?.alpha).toBeCloseTo(0.5, 6); // divOpacity
  });

  it('クロス2件: 白地は1回・下A@1 → 上B@t の順で scratch へ重ね描き（真ディゾルブ）', () => {
    const out = makeCanvas('out');
    const scratch = makeCanvas('scratch');
    const fb = makeCanvas('fb');
    const us = makeCanvas('us');
    const A = state({ cutIndex: 0, canvasOpacity: 1 });
    const B = state({ cutIndex: 1, canvasOpacity: 0.5, divOpacity: 1 });
    compositeFrame(
      [A, B],
      [flatCut(), flatCut()],
      { width: 100, height: 100 },
      out.canvas as never,
      scratch.canvas as never,
      fb.canvas as never,
      us.canvas as never,
    );
    // 白地 fillRect は1回だけ（最後発カットの rect に敷く）
    expect(scratch.ops.filter((o) => o.type === 'fillRect').length).toBe(1);
    // scratch への frameBuffer 描画は2回（A@1 → B@0.5）
    const scDraws = scratch.ops.filter((o) => o.type === 'drawImage' && o.src === 'fb');
    expect(scDraws.map((o) => o.alpha)).toEqual([1, 0.5]);
    // out への合成は最後発 B の divOpacity(1)
    const outDraw = out.ops.find((o) => o.type === 'drawImage' && o.src === 'scratch');
    expect(outDraw?.alpha).toBeCloseTo(1, 6);
  });

  it('doc 寸 > frame 寸: frameBuffer/unitScratch を doc 寸へリサイズする（クロップ防止）', () => {
    const bigCut = {
      time: 24,
      picture: { width: 200, height: 150, children: [{ name: 'bg', canvas: fakeLayer() }, { name: 'l', canvas: fakeLayer() }] },
    } as unknown as Cut;
    const out = makeCanvas('out', 100, 100);
    const scratch = makeCanvas('scratch', 100, 100);
    const fb = makeCanvas('fb', 100, 100);
    const us = makeCanvas('us', 100, 100);
    compositeFrame([state()], [bigCut], { width: 100, height: 100 }, out.canvas as never, scratch.canvas as never, fb.canvas as never, us.canvas as never);
    expect(fb.canvas.width).toBe(200);
    expect(fb.canvas.height).toBe(150);
    expect(us.canvas.width).toBe(200);
    expect(us.canvas.height).toBe(150);
    expect(fb.ops.filter((o) => o.type === 'drawImage').length).toBe(2);
  });
});
