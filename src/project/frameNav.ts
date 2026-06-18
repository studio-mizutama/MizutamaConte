/** 再生フレームを [0, timeTotal-1] にクランプする純関数。timeTotal<=0 は 0。 */
export const clampFrame = (time: number, timeTotal: number): number => {
  if (timeTotal <= 0) return 0;
  return Math.max(0, Math.min(time, timeTotal - 1));
};
