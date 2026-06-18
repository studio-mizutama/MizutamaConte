import { AspectKey, FrameSize, ProjectSettings, ResolutionKey } from './types';

/** 解像度は横幅基準（シネスコ等の横長アスペクトでも幅が規格に一致する） */
export const RESOLUTION_WIDTHS: Record<ResolutionKey, number> = {
  SD: 720,
  HD: 1280,
  FHD: 1920,
  '2K': 2048,
  '4K': 3840,
};

export const ASPECT_RATIOS: Record<AspectKey, number> = {
  '4:3': 4 / 3,
  '16:9': 16 / 9,
  '1.85:1': 1.85,
  '2.39:1': 2.39,
};

export const RESOLUTION_KEYS = Object.keys(RESOLUTION_WIDTHS) as ResolutionKey[];
export const ASPECT_KEYS = Object.keys(ASPECT_RATIOS) as AspectKey[];

/** 作品フレーム（画面に映る領域）のサイズを導出する。高さは偶数に丸める */
export const deriveFrame = (resolution: ResolutionKey, aspect: AspectKey): FrameSize => {
  const width = RESOLUTION_WIDTHS[resolution];
  const height = Math.round(width / ASPECT_RATIOS[aspect] / 2) * 2;
  return { width, height };
};

/** 既定キャンバスは作品フレームの1.25倍（カメラワークの余白分） */
export const CANVAS_MARGIN_RATIO = 1.25;

export const defaultCanvasSize = (frame: FrameSize): FrameSize => ({
  width: Math.round(frame.width * CANVAS_MARGIN_RATIO),
  height: Math.round(frame.height * CANVAS_MARGIN_RATIO),
});

export const DEFAULT_SETTINGS: ProjectSettings = {
  aspect: '16:9',
  resolution: 'FHD',
  frame: deriveFrame('FHD', '16:9'),
  fps: 24,
};

/** Edit 画面 PICTURE 列のサムネイル縮尺。FHD 既定キャンバス(2400px)が288px列に収まる比率 */
export const THUMBNAIL_COLUMN_WIDTH = 288;

export const thumbnailScale = (frame: FrameSize): number =>
  THUMBNAIL_COLUMN_WIDTH / (frame.width * CANVAS_MARGIN_RATIO);
