import { useGlobal } from 'reactn';

/** 印刷をトリガするフック。返り値を呼ぶとグローバル flag が立ち、PrintHost が印刷処理を始める。 */
export const usePrint = (): (() => void) => {
  const setPrintRequested = useGlobal('printRequested')[1];
  return () => setPrintRequested(true);
};
