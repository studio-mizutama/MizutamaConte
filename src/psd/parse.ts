import { readPsd } from 'ag-psd';
import { normalizePsdLayers } from 'psd/normalize';

/** 生 PSD バイトをキャッシュ用 Psd へ変換する。loader（load.ts）と同一ルート（readPsd→normalize） */
export const parsePsdBytes = (bytes: Uint8Array) =>
  normalizePsdLayers(readPsd(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer));
