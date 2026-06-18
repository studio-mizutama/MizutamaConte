import { describe, it, expect, vi } from 'vitest';
import { drawModel } from './composite';
import type { FrameModel } from 'project/frameModel';

interface Call {
  op: string;
  alpha: number;
}
const makeCtx = () => {
  const calls: Call[] = [];
  const ctx = {
    globalAlpha: 1,
    globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
    clearRect: vi.fn(),
    drawImage: vi.fn(function (this: { globalAlpha: number; globalCompositeOperation: string }) {
      calls.push({ op: this.globalCompositeOperation, alpha: this.globalAlpha });
    }),
  };
  return { ctx, calls };
};
const cvs = () => ({}) as unknown as HTMLCanvasElement;
const makeScratch = () => {
  const { ctx } = makeCtx();
  return { width: 10, height: 10, getContext: () => ctx } as unknown as HTMLCanvasElement;
};

describe('drawModel', () => {
  it('背景→単独ユニットを正しい合成オペ・α で描く', () => {
    const { ctx, calls } = makeCtx();
    const model: FrameModel = {
      width: 10,
      height: 10,
      background: [{ canvas: cvs(), blendMode: 'source-over', opacity: 1, clipping: false }],
      units: [{ layers: [{ canvas: cvs(), blendMode: 'multiply', opacity: 0.5, clipping: false }], blendMode: 'source-over', opacity: 1 }],
    };
    drawModel(ctx as unknown as CanvasRenderingContext2D, model, makeScratch(), 0);
    expect(calls.length).toBe(2); // 背景 + 単独レイヤー
    expect(calls[0]).toEqual({ op: 'source-over', alpha: 1 }); // 背景
    expect(calls[1]).toEqual({ op: 'multiply', alpha: 0.5 }); // 単独レイヤーは直接描画
  });

  it("'all' で全ユニットを順に描く", () => {
    const { ctx, calls } = makeCtx();
    const model: FrameModel = {
      width: 10,
      height: 10,
      background: [],
      units: [
        { layers: [{ canvas: cvs(), blendMode: 'source-over', opacity: 1, clipping: false }], blendMode: 'source-over', opacity: 1 },
        { layers: [{ canvas: cvs(), blendMode: 'screen', opacity: 1, clipping: false }], blendMode: 'source-over', opacity: 1 },
      ],
    };
    drawModel(ctx as unknown as CanvasRenderingContext2D, model, makeScratch(), 'all');
    expect(calls.map((c) => c.op)).toEqual(['source-over', 'screen']);
  });

  it('複数レイヤーのユニットは scratch 経由でユニット blend/opacity を適用', () => {
    const { ctx, calls } = makeCtx();
    const model: FrameModel = {
      width: 10,
      height: 10,
      background: [],
      units: [
        {
          layers: [
            { canvas: cvs(), blendMode: 'source-over', opacity: 1, clipping: false },
            { canvas: cvs(), blendMode: 'multiply', opacity: 1, clipping: false },
          ],
          blendMode: 'screen',
          opacity: 0.8,
        },
      ],
    };
    drawModel(ctx as unknown as CanvasRenderingContext2D, model, makeScratch(), 0);
    // ctx への描画は scratch の1回だけ（ユニット blend=screen, opacity=0.8）
    expect(calls.length).toBe(1);
    expect(calls[0]).toEqual({ op: 'screen', alpha: 0.8 });
  });

  it('clipping レイヤーは scratch 内で source-atop', () => {
    const scratchCalls: Call[] = [];
    const sctx = {
      globalAlpha: 1,
      globalCompositeOperation: 'source-over' as GlobalCompositeOperation,
      clearRect: vi.fn(),
      drawImage: vi.fn(function (this: { globalAlpha: number; globalCompositeOperation: string }) {
        scratchCalls.push({ op: this.globalCompositeOperation, alpha: this.globalAlpha });
      }),
    };
    const scratch = { width: 10, height: 10, getContext: () => sctx } as unknown as HTMLCanvasElement;
    const { ctx } = makeCtx();
    const model: FrameModel = {
      width: 10,
      height: 10,
      background: [],
      units: [
        {
          layers: [
            { canvas: cvs(), blendMode: 'source-over', opacity: 1, clipping: false }, // ベース
            { canvas: cvs(), blendMode: 'source-over', opacity: 1, clipping: true }, // クリップ塗り
          ],
          blendMode: 'source-over',
          opacity: 1,
        },
      ],
    };
    drawModel(ctx as unknown as CanvasRenderingContext2D, model, scratch, 0);
    expect(scratchCalls[0].op).toBe('source-over'); // ベース
    expect(scratchCalls[1].op).toBe('source-atop'); // クリップ
  });

  it('範囲外 unitIndex は背景のみ描画', () => {
    const { ctx, calls } = makeCtx();
    const model: FrameModel = {
      width: 10,
      height: 10,
      background: [{ canvas: cvs(), blendMode: 'source-over', opacity: 1, clipping: false }],
      units: [{ layers: [{ canvas: cvs(), blendMode: 'source-over', opacity: 1, clipping: false }], blendMode: 'source-over', opacity: 1 }],
    };
    drawModel(ctx as unknown as CanvasRenderingContext2D, model, makeScratch(), 5);
    expect(calls.length).toBe(1); // 背景のみ
  });
});
