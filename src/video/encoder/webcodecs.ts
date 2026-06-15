import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { videoBitrate } from 'video/quality';
import type { VideoEncoderBackend, VideoExportOptions } from 'video/encoder';

/**
 * WebCodecs(VideoEncoder) + mp4-muxer による H.264/MP4 エンコーダ。
 * OS のハードウェアエンコーダ（VideoToolbox 等）を使うため高速。Web/Electron 共通。
 */
export class WebCodecsBackend implements VideoEncoderBackend {
  private muxer?: Muxer<ArrayBufferTarget>;
  private encoder?: VideoEncoder;

  async init(opts: VideoExportOptions): Promise<void> {
    const { frame, fps, quality } = opts;
    this.muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: { codec: 'avc', width: frame.width, height: frame.height },
      fastStart: 'in-memory',
    });
    this.encoder = new VideoEncoder({
      output: (chunk, meta) => this.muxer?.addVideoChunk(chunk, meta),
      error: (e) => {
        throw e;
      },
    });
    this.encoder.configure({
      codec: 'avc1.640033', // H.264 High@5.1（SD〜4K を一律にカバー）
      width: frame.width,
      height: frame.height,
      bitrate: videoBitrate(frame, fps, quality),
      framerate: fps,
    });
  }

  async encodeFrame(frame: VideoFrame, index: number): Promise<void> {
    if (!this.encoder) throw new Error('encoder not initialized');
    // 60 フレームごとにキーフレーム（シーク性とサイズのバランス）
    this.encoder.encode(frame, { keyFrame: index % 60 === 0 });
    // バックプレッシャ: エンコードキューが溜まりすぎたら一旦譲る
    if (this.encoder.encodeQueueSize > 30) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }

  async finish(): Promise<Uint8Array> {
    if (!this.encoder || !this.muxer) throw new Error('encoder not initialized');
    await this.encoder.flush();
    this.muxer.finalize();
    const { buffer } = this.muxer.target;
    return new Uint8Array(buffer);
  }

  close(): void {
    try {
      this.encoder?.close();
    } catch {
      // 既に閉じている場合は無視
    }
  }
}
