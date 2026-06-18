import type { FrameSize } from 'project/types';

/** 動画品質プリセット（内部キー。表示は i18n） */
export type VideoQuality = 'high' | 'medium';

/** bits-per-pixel。high=0.15 / medium=0.075（実装後 1080p で目視調整可） */
const BPP: Record<VideoQuality, number> = { high: 0.15, medium: 0.075 };
const MIN_BITRATE = 2_000_000; // 2 Mbps
const MAX_BITRATE = 60_000_000; // 60 Mbps（4K 暴走防止）

/** 解像度・fps・品質から目標ビットレート(bps)を算出する純関数 */
export const videoBitrate = (frame: FrameSize, fps: number, quality: VideoQuality): number => {
  const raw = frame.width * frame.height * fps * BPP[quality];
  return Math.round(Math.min(Math.max(raw, MIN_BITRATE), MAX_BITRATE));
};

/** H.264 yuv420p は幅・高さとも偶数必須。奇数は切り下げる純関数 */
export const evenFrameSize = (frame: FrameSize): FrameSize => ({
  width: Math.floor(frame.width / 2) * 2,
  height: Math.floor(frame.height / 2) * 2,
});
