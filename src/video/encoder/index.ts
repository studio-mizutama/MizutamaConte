import type { FrameSize } from 'project/types';
import type { VideoQuality } from 'video/quality';
import { WebCodecsBackend } from 'video/encoder/webcodecs';

export interface VideoExportOptions {
  /** 偶数化済みのネイティブ出力サイズ */
  frame: FrameSize;
  fps: number;
  quality: VideoQuality;
}

/** 差し替え可能なエンコーダ。将来 ffmpeg バックエンドを足す拡張点。 */
export interface VideoEncoderBackend {
  init(opts: VideoExportOptions): Promise<void>;
  encodeFrame(frame: VideoFrame, index: number): Promise<void>;
  finish(): Promise<Uint8Array>;
  close(): void;
}

export type EncoderKind = 'webcodecs'; // 将来: | 'ffmpeg'

export const createEncoder = (kind: EncoderKind): VideoEncoderBackend => {
  switch (kind) {
    case 'webcodecs':
      return new WebCodecsBackend();
    default:
      throw new Error(`Unknown encoder kind: ${kind}`);
  }
};
