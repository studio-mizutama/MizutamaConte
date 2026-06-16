import { useCallback, useEffect, useRef, useState } from 'react';

export interface Stopwatch {
  isCounting: boolean;
  /** 計測中の経過ミリ秒（RAF で更新）。 */
  elapsedMs: number;
  start: () => void;
  /** 計測を止めて経過ミリ秒を返す（呼び出し側が msToFrames でコミット）。 */
  stop: () => number;
  reset: () => void;
}

/** performance.now() + requestAnimationFrame による経過計測（Preview 再生ループと同型）。 */
export const useStopwatch = (): Stopwatch => {
  const [isCounting, setIsCounting] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    setElapsedMs(performance.now() - startRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    startRef.current = performance.now();
    setElapsedMs(0);
    setIsCounting(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setIsCounting(false);
    return performance.now() - startRef.current;
  }, []);

  const reset = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setIsCounting(false);
    setElapsedMs(0);
  }, []);

  // アンマウント時に RAF をキャンセルする
  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  return { isCounting, elapsedMs, start, stop, reset };
};
