import { useEffect, useState } from 'react';

export interface ViewportSize {
  width: number;
  height: number;
}

/**
 * ウィンドウのビューポートサイズを ResizeObserver 主導で返す。
 * resize イベントより細かく追従するため、ドラッグリサイズ中の追従が滑らかになる。
 * ResizeObserver 非対応環境では resize リスナーにフォールバックする。
 */
export const useViewportSize = (): ViewportSize => {
  const [size, setSize] = useState<ViewportSize>(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      ro.observe(document.documentElement);
    }
    return () => {
      window.removeEventListener('resize', update);
      ro?.disconnect();
    };
  }, []);

  return size;
};
