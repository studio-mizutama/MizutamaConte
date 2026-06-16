import type { FrameSize } from 'project/types';
import { frameStates } from 'project/frameState';
import { compositeFrame } from 'video/compositor';
import { createEncoder } from 'video/encoder';
import { evenFrameSize, VideoQuality } from 'video/quality';
import { totalFrames } from 'project/cutOffsets';

// 総フレーム数は時間モデルの単一ソース（Cross 重なり差し引き済み）を再エクスポート。
// VideoExportHost が 'video/exportVideo' から import しているため公開 API を維持する。
export { totalFrames };

export interface ExportProgress {
  frame: number;
  total: number;
}

/** キャンセル用の可変フラグ（呼び出し側が canceled=true にすると中断） */
export interface ExportControl {
  canceled: boolean;
}

/**
 * タイムライン全体をネイティブ解像度・ネイティブ fps で合成 → WebCodecs でエンコード → MP4 バイト列を返す。
 * キャンセル時は null を返す。UI を固めないよう数フレームごとに進捗通知して制御を譲る。
 */
export const exportVideo = async (
  cuts: Cut[],
  frame: FrameSize,
  fps: number,
  quality: VideoQuality,
  onProgress: (p: ExportProgress) => void,
  control: ExportControl,
): Promise<Uint8Array | null> => {
  const size = evenFrameSize(frame);
  const total = totalFrames(cuts);
  const encoder = createEncoder('webcodecs');
  await encoder.init({ frame: size, fps, quality });

  const out = new OffscreenCanvas(size.width, size.height);
  const scratch = new OffscreenCanvas(size.width, size.height);
  const frameBuffer = new OffscreenCanvas(size.width, size.height);
  const unitScratch = new OffscreenCanvas(size.width, size.height);

  try {
    for (let f = 0; f < total; f++) {
      if (control.canceled) {
        encoder.close();
        return null;
      }
      const states = frameStates(f, cuts);
      compositeFrame(states, cuts, size, out, scratch, frameBuffer, unitScratch);
      const vf = new VideoFrame(out, {
        timestamp: Math.round((f * 1_000_000) / fps),
        duration: Math.round(1_000_000 / fps),
      });
      await encoder.encodeFrame(vf, f);
      vf.close();
      if (f % 5 === 0) {
        onProgress({ frame: f, total });
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
      }
    }
    onProgress({ frame: total, total });
    return await encoder.finish();
  } catch (e) {
    encoder.close();
    throw e;
  }
};
