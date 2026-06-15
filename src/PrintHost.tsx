import React, { useState, useRef, useMemo, useEffect, useLayoutEffect, useGlobal } from 'reactn';
import { createPortal } from 'react-dom';
import { useProject } from 'hooks/useProject';
import { usePsd } from 'hooks/usePsd';
import { deriveScenes } from 'project/scene';
import { paginate, Page, CutBlock } from 'print/paginate';
import { PAGE_CUT_CAPACITY } from 'print/constants';
import { PrintView } from 'PrintView';

/**
 * 印刷の駆動役。printRequested が立つと PrintView を画面外に1パス描画して各 CUT の実高さを測り、
 * paginate でページ確定してから window.print() を呼ぶ。afterprint でフラグ・タイトルを戻し撤去する。
 */
export const PrintHost: React.FC = () => {
  const [printRequested, setPrintRequested] = useGlobal('printRequested');
  const { project, frame, fps } = useProject();
  const cuts = usePsd();
  const fileName = useGlobal('globalFileName')[0];
  const title = fileName.replace(/\.json$/i, '');
  const [pages, setPages] = useState<Page[] | null>(null);
  const docRef = useRef<HTMLDivElement>(null);

  const scenes = useMemo(() => deriveScenes(project.cuts), [project.cuts]);
  const sceneStarts = useMemo(() => {
    const starts = new Array<boolean>(project.cuts.length).fill(false);
    scenes.forEach((s) => {
      starts[s.startIndex] = true;
    });
    return starts;
  }, [scenes, project.cuts.length]);

  // 計測パス（pages===null）→ 各 CUT 高さを実測してページ割り
  useLayoutEffect(() => {
    if (!printRequested) return;
    // プロジェクト未読込（CUT 0件）では印刷しない（メニュー/ボタンの無効化に対する防御）
    if (cuts.length === 0) {
      setPrintRequested(false);
      return;
    }
    if (pages || !docRef.current) return;
    const nodes = docRef.current.querySelectorAll<HTMLElement>('[data-cut-index]');
    const blocks: CutBlock[] = Array.from(nodes).map((node) => {
      const index = Number(node.dataset.cutIndex);
      return { index, isSceneStart: sceneStarts[index] ?? false, height: node.offsetHeight };
    });
    setPages(paginate(blocks, PAGE_CUT_CAPACITY));
  }, [printRequested, pages, sceneStarts, cuts.length]);

  // ページ確定後 → タイトルをプロジェクト名へ差し替え → 印刷 → afterprint で後始末
  useEffect(() => {
    if (!printRequested || !pages) return;
    const prevTitle = document.title;
    document.title = title || prevTitle; // PDF 既定ファイル名は document.title 由来
    const cleanup = () => {
      window.removeEventListener('afterprint', cleanup);
      document.title = prevTitle;
      setPages(null);
      setPrintRequested(false);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    return () => window.removeEventListener('afterprint', cleanup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printRequested, pages]);

  if (!printRequested) return null;

  return createPortal(
    <div className="print-root" ref={docRef}>
      <PrintView title={title} cuts={cuts} scenes={scenes} frame={frame} fps={fps} pages={pages} />
    </div>,
    document.body,
  );
};
