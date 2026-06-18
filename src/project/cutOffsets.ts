/**
 * Cross フェードの時間モデル（単一ソース）。
 * Cross の重なりはグローバル尺から差し引かれ、各カットの span は常に自身の尺を保つ。
 * 純関数のみ・副作用なし。型 Cut/Action はグローバル宣言のため import 不要。
 */

/** グローバルフレームの半開区間 [start, end)。end - start は常にカット自身の time。 */
export interface CutSpan {
  start: number;
  end: number;
}

/**
 * カット i と i+1 の Cross 重なり（フレーム数）。
 * 両側が Cross のときのみ fadeOutDuration を、自身・相方の尺で二重にクランプして返す。
 */
export const crossOverlap = (cuts: Cut[], i: number): number => {
  const a = cuts[i];
  const b = cuts[i + 1];
  if (!a || !b) return 0;
  if (a.action?.fadeOut !== 'Cross' || b.action?.fadeIn !== 'Cross') return 0;
  const d = a.action?.fadeOutDuration ?? 0;
  return Math.max(0, Math.min(d, a.time ?? 0, b.time ?? 0));
};

/**
 * 各カットのグローバル span。
 * 漸化式: start_0=0 / start_i = max(start_{i-1}, end_{i-1} − overlap(i-1)) / end_i = start_i + time。
 * max により start は単調非減少（連続クロスでも順序逆転しない）。
 */
export const cutOffsets = (cuts: Cut[]): CutSpan[] => {
  const spans: CutSpan[] = [];
  let prevEnd = 0;
  for (let i = 0; i < cuts.length; i++) {
    const time = cuts[i].time ?? 0;
    const overlap = i === 0 ? 0 : crossOverlap(cuts, i - 1);
    const start = i === 0 ? 0 : Math.max(spans[i - 1].start, prevEnd - overlap);
    const end = start + time;
    spans.push({ start, end });
    prevEnd = end;
  }
  return spans;
};

/** タイムライン総フレーム数（= 末尾 span の end・重なり差し引き済み）。 */
export const totalFrames = (cuts: Cut[]): number => {
  const spans = cutOffsets(cuts);
  return spans.length ? spans[spans.length - 1].end : 0;
};

/**
 * frame を含むカット index。choice B = 重なり区間では後発カット（last-match）。
 * 範囲外（総尺以上 / 負）は null。
 */
export const currentCutIndex = (frame: number, cuts: Cut[]): number | null => {
  const spans = cutOffsets(cuts);
  let found: number | null = null;
  for (let i = 0; i < spans.length; i++) {
    if (spans[i].start <= frame && frame < spans[i].end) found = i; // 後発で上書き
  }
  return found;
};

/** Preview の HUD（左上=start / 右上=hudEnd）とカット送り（←=prevStart / →=nextStart）の単一ソース。 */
export interface CutNav {
  index: number;
  /** 現在カットの開始（HUD 左上） */
  start: number;
  /** 現在カット終了 = start + cut.time（HUD 右上・常にカット自身の尺） */
  hudEnd: number;
  /** 前カットの開始（カット送り ←。先頭は 0） */
  prevStart: number;
  /** 次カットの開始（カット送り →。末尾は総尺） */
  nextStart: number;
}

export const cutNav = (frame: number, cuts: Cut[]): CutNav => {
  const spans = cutOffsets(cuts);
  if (!spans.length) return { index: 0, start: 0, hudEnd: 0, prevStart: 0, nextStart: 0 };
  const total = spans[spans.length - 1].end;
  // choice B（最後発）。範囲外は末尾カットへクランプ（既存 activeCutInfo の挙動を踏襲）。
  let index = spans.length - 1;
  for (let i = 0; i < spans.length; i++) {
    if (spans[i].start <= frame && frame < spans[i].end) index = i;
  }
  const start = spans[index].start;
  const hudEnd = start + (cuts[index].time ?? 0);
  const prevStart = index > 0 ? spans[index - 1].start : 0;
  const nextStart = index < spans.length - 1 ? spans[index + 1].start : total;
  return { index, start, hudEnd, prevStart, nextStart };
};
