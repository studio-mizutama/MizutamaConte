import { useMemo, useGlobal } from 'reactn';
import { useProject } from 'hooks/useProject';

/**
 * プロジェクト (v2) + psdCache から、表示用の Cut 配列（旧形式）を導出する。
 * dialogue は行単位の値をカット単位に結合して互換表示にする。
 */
export const usePsd = (): Cut[] => {
  const { project } = useProject();
  const psdCache = useGlobal('psdCache')[0];

  return useMemo(
    () =>
      project.cuts.map((cut) => ({
        picture: cut.psd ? psdCache[cut.psd] : undefined,
        cameraWork: cut.cameraWork,
        action: cut.action,
        dialogue: cut.rows.map((row) => row.dialogue ?? '').join(''),
        time: cut.time,
      })),
    [project, psdCache],
  );
};
