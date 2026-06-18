/** カット尺（フレーム数）の不変条件と安全な境界。
 *  0コマ禁止・巨大値での Timeline クラッシュ（RangeError: Invalid array length）防止を担う純関数群。 */

/** カットは必ず 1 コマ以上（時間 0 コマのカットは存在してはならない）。 */
export const MIN_FRAMES = 1;

/** Timeline の range() が生成する配列長の上限。
 *  これを超えると new Array() が RangeError を投げる/巨大配列でフリーズするため保険でクランプする。 */
export const MAX_TIMELINE_FRAMES = 2_000_000;

/** 1カットの尺の上限 = fps×3600（1時間相当）。fps 不正時は MIN_FRAMES。 */
export const maxCutFrames = (fps: number): number =>
  Number.isFinite(fps) && fps > 0 ? Math.max(MIN_FRAMES, Math.round(fps) * 3600) : MIN_FRAMES;

/** カット尺として受理可能か（有限整数・MIN_FRAMES〜上限）。
 *  不成立なら呼び出し側は確定せず直前の正常値へフォールバックする。 */
export const isValidCutFrames = (frames: number, fps: number): boolean =>
  Number.isFinite(frames) && Math.floor(frames) === frames && frames >= MIN_FRAMES && frames <= maxCutFrames(fps);

/** Timeline range() の end を安全化（非有限→0・負→0・巨大→上限・整数化）。 */
export const clampTimelineEnd = (end: number): number =>
  Number.isFinite(end) ? Math.max(0, Math.min(Math.floor(end), MAX_TIMELINE_FRAMES)) : 0;
