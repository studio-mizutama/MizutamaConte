import { useGlobal } from 'reactn';

/** 動画書き出しをトリガするフック。返り値を呼ぶと videoExportRequested が立ち、VideoExportHost が起動する。 */
export const useVideoExport = (): (() => void) => {
  const setVideoExportRequested = useGlobal('videoExportRequested')[1];
  return () => setVideoExportRequested(true);
};
