/**
 * フレーム数を「秒:コマ」表記に変換する。
 * 例 (24fps): 168 → "7:00"、30 → "1:06"、12 → "12"
 * （従来の表示仕様を踏襲: fps 以下はコマ数のみの2桁表示）
 */
/**
 * 「秒:コマ」または素のフレーム数の入力をフレーム数に変換する。
 * 例 (24fps): "7:00" → 168、"168" → 168。解釈できなければ null
 */
export const parseTimecode = (text: string, fps: number): number | null => {
  const trimmed = text.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const match = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (!match) return null;
  return Number(match[1]) * fps + Number(match[2]);
};

export const frameToTimecode = (frames: number, fps: number): string => {
  const value = Math.round(frames);
  if (value > fps) {
    return `${(value / fps) | 0}:${('00' + (value % fps)).slice(-2)}`;
  }
  return ('00' + value).slice(-2);
};
