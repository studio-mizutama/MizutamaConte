import { useMemo, useGlobal, useRef } from 'reactn';
import { useProject } from 'hooks/useProject';
import { reconcileDisplayCuts, DisplayCacheEntry } from 'project/displayCut';
import { ProjectCut } from 'project/types';

/**
 * プロジェクト (v2) + psdCache から、表示用の Cut 配列（旧形式）を導出する。
 * 変化していないカットは前回と同一参照を返し、下流の React.memo を機能させる。
 */
export const usePsd = (): Cut[] => {
  const { project } = useProject();
  const psdCache = useGlobal('psdCache')[0];
  const cacheRef = useRef<Map<ProjectCut, DisplayCacheEntry>>(new Map());

  return useMemo(() => {
    const { list, cache } = reconcileDisplayCuts(project.cuts, psdCache, cacheRef.current);
    cacheRef.current = cache;
    return list;
  }, [project, psdCache]);
};
