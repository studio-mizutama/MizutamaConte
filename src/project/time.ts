const pad2 = (n: number): string => String(n).padStart(2, '0');

/**
 * フレーム数を `HH:MM:SS+FF` 表記へ変換する。H/M が 0 の単位は省略。
 * 各単位は常に2桁ゼロ詰め（SMPTE風）。fps フレーム = 1 秒。
 * 例 (24fps): 0→"00+00"、12→"00+12"、24→"01+00"、1620→"01:07+12"、86400→"01:00:00+00"
 */
export const frameToTimecode = (frames: number, fps: number): string => {
  // 壊れた JSON 由来の NaN/Infinity・fps<=0 でも '00+00' へ倒し、表示崩壊（'NaN+NaN' 等）を防ぐ
  const safeFps = Number.isFinite(fps) && fps > 0 ? Math.floor(fps) : 24;
  const value = Number.isFinite(frames) ? Math.max(0, Math.round(frames)) : 0;
  const totalSec = Math.floor(value / safeFps);
  const f = value % safeFps;
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${pad2(h)}:${pad2(m)}:${pad2(s)}+${pad2(f)}`;
  if (m > 0) return `${pad2(m)}:${pad2(s)}+${pad2(f)}`;
  return `${pad2(s)}+${pad2(f)}`;
};

/**
 * タイムコード入力をフレーム数へ変換する。寛容に受理し、解釈できなければ null。
 * - "168"           → 生フレーム（コマ）として解釈
 * - "45+12"         → SS+FF
 * - "01:30+00"      → MM:SS+FF
 * - "01:23:45+12"   → HH:MM:SS+FF
 * - "01:30"/"01:00:00" → コマ0として寛容に受理
 */
export const parseTimecode = (text: string, fps: number): number | null => {
  const t = text.trim();
  let m: RegExpMatchArray | null;
  if (/^\d+$/.test(t)) {
    const n = Number(t);
    return Number.isFinite(n) ? n : null; // 309桁等で Number→Infinity になる入力は解釈不能=直前値維持
  }
  if ((m = t.match(/^(\d+):(\d+):(\d+)\+(\d+)$/))) {
    return (Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])) * fps + Number(m[4]);
  }
  if ((m = t.match(/^(\d+):(\d+)\+(\d+)$/))) {
    return (Number(m[1]) * 60 + Number(m[2])) * fps + Number(m[3]);
  }
  if ((m = t.match(/^(\d+)\+(\d+)$/))) {
    return Number(m[1]) * fps + Number(m[2]);
  }
  if ((m = t.match(/^(\d+):(\d+):(\d+)$/))) {
    return (Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])) * fps;
  }
  if ((m = t.match(/^(\d+):(\d+)$/))) {
    return (Number(m[1]) * 60 + Number(m[2])) * fps;
  }
  return null;
};

/** 実時間 ms を fps でフレーム数へ換算（ストップウォッチ用・0未満は0にクランプ）。 */
export const msToFrames = (ms: number, fps: number): number => Math.max(0, Math.round((ms / 1000) * fps));
