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
  /** WebCodecs はエンコードエラーを別タスクの error コールバックで通知する。
   *  ここで捕捉し、await 中の encodeFrame/finish から再 throw して通常の例外経路で扱う
   *  （コールバック内で throw すると未捕捉例外になり、await 中の Promise を reject できないため）。 */
  private failure?: unknown;

  async init(opts: VideoExportOptions): Promise<void> {
    const { frame, fps, quality } = opts;
    const config: VideoEncoderConfig = {
      codec: 'avc1.640033', // H.264 High@5.1（SD〜4K を一律にカバー）
      width: frame.width,
      height: frame.height,
      bitrate: videoBitrate(frame, fps, quality),
      framerate: fps,
    };
    // 非対応環境（H.264 エンコーダ不在）では configure 前に明示エラーにする
    const support = await VideoEncoder.isConfigSupported(config);
    if (!support.supported) {
      throw new Error('UNSUPPORTED_CODEC');
    }
    this.muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: { codec: 'avc', width: frame.width, height: frame.height, frameRate: fps },
      fastStart: 'in-memory',
    });
    this.encoder = new VideoEncoder({
      output: (chunk, meta) => this.muxer?.addVideoChunk(chunk, meta),
      // 別タスク実行のため throw せず捕捉のみ。await 経路（encodeFrame/finish）で再 throw する。
      error: (e) => {
        this.failure = e;
      },
    });
    this.encoder.configure(config);
  }

  async encodeFrame(frame: VideoFrame, index: number): Promise<void> {
    if (!this.encoder) throw new Error('encoder not initialized');
    if (this.failure) throw this.failure;
    // 60 フレームごとにキーフレーム（シーク性とサイズのバランス）
    this.encoder.encode(frame, { keyFrame: index % 60 === 0 });
    // バックプレッシャ: エンコードキューが溜まりすぎたら一旦譲る
    if (this.encoder.encodeQueueSize > 30) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }

  async finish(): Promise<Uint8Array> {
    if (!this.encoder || !this.muxer) throw new Error('encoder not initialized');
    if (this.failure) throw this.failure;
    await this.encoder.flush();
    if (this.failure) throw this.failure;
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
