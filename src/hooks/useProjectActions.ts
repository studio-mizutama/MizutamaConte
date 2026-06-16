import { useGlobal } from 'reactn';
import { useProject } from 'hooks/useProject';
import { appendCut, appendLayer, appendSceneCut, deleteCutAt, insertCutAfter, mergeCuts, nextPsdName, orphanedPsdAfterMerge, resizeCutCanvas, splitLastLayer, setSceneStart, setSceneTitle, setFadeType, setFadeDuration, FadeSide, FadeType, updateCutAt, updateDialogueAt } from 'project/actions';
import { createTemplatePsd, appendLayerToPsd, mergePsd, resizeDocPsd, splitTopLayerPsd, isBlankPsd } from 'psd/template';
import { ProjectFile, FrameSize } from 'project/types';
import { getStorage } from 'storage';
import { record, clearHistory } from 'history/undoManager';
import { FileSwap, makeOverwriteSwap, makeDeleteSwap, makeCreateSwap, composeSwaps } from 'history/fileSwap';
import { makeCreatePsdRevert, makeCreatePsdReapply } from 'history/effects';

/** Edit 画面からのプロジェクト編集操作。変更は自動保存 (useAutoSave) が拾う */
export const useProjectActions = () => {
  const { project, setProject, frame, fps } = useProject();
  const [psdCache, setPsdCache] = useGlobal('psdCache');
  const storage = getStorage();

  const selectedCutIndex = useGlobal('selectedCutIndex')[0];

  /** 純データ編集（ディスク副作用なし）の共通記録。coalesceKey 指定で連続編集を 1 ステップに合流 */
  const commit = (label: string, next: ProjectFile, coalesceKey?: string): void => {
    const prev = project;
    setProject(next);
    record({
      label,
      coalesceKey,
      prevProject: prev,
      nextProject: next,
      prevSelectedCutIndex: selectedCutIndex,
      nextSelectedCutIndex: selectedCutIndex,
    });
  };

  const setDialogue = (index: number, dialogue: string) =>
    commit('dialogue', updateDialogueAt(project, index, dialogue), `dialogue:${index}`);

  const setActionText = (index: number, text: string) =>
    commit('action', updateCutAt(project, index, { action: { ...project.cuts[index]?.action, text } }), `action:${index}`);

  const setTime = (index: number, time: number) =>
    commit('time', updateCutAt(project, index, { time }), `time:${index}`);

  const setAction = (index: number, action: Action) =>
    commit('action', updateCutAt(project, index, { action }), `action:${index}`);

  const setCameraWork = (index: number, cameraWork: CameraWork) =>
    commit('camera', updateCutAt(project, index, { cameraWork }));

  /** 行追加: PSD 雛形を生成・保存し、カットを末尾に追加する。
   *  新規カットはネイティブ解像度（canvas=frame）で生成する。カメラワークが必要なら
   *  クロップツールでキャンバスを拡大する（拡大した余白の中をフレームが動く）。 */
  const addCut = async () => {
    const prev = project;
    const prevIdx = selectedCutIndex;
    const size = { ...frame };
    const { psd, buffer } = createTemplatePsd(size.width, size.height);
    const psdName = nextPsdName(prev);
    if (storage.capabilities.write) {
      await storage.writeFile(psdName, buffer);
    }
    await setPsdCache({ ...psdCache, [psdName]: psd });
    const next = appendCut(prev, psdName, size, fps * 3);
    await setProject(next);
    record({
      label: 'addCut',
      prevProject: prev,
      nextProject: next,
      prevSelectedCutIndex: prevIdx,
      nextSelectedCutIndex: prevIdx,
      diskRevert: makeCreatePsdRevert(psdName),
      diskReapply: makeCreatePsdReapply(psdName, size.width, size.height),
    });
  };

  /** New Layer: 現在のカットへ透明レイヤーを追記し、行を追加する */
  const addLayer = async (cutIndex: number) => {
    const cut = project.cuts[cutIndex];
    if (!cut?.psd) return;
    const psd = psdCache[cut.psd];
    if (!psd) return;
    const prev = project;
    const prevIdx = selectedCutIndex;
    const { psd: nextPsd, buffer } = appendLayerToPsd(psd, String(cut.rows.length + 1));
    const swaps: FileSwap[] = [];
    if (storage.capabilities.write) {
      const preToken = await storage.trashFile(cut.psd);
      await storage.writeFile(cut.psd, buffer);
      swaps.push(makeOverwriteSwap(cut.psd, preToken));
    }
    await setPsdCache({ ...psdCache, [cut.psd]: nextPsd });
    const next = appendLayer(project, cutIndex);
    await setProject(next);
    if (!storage.capabilities.write) {
      clearHistory();
      return;
    }
    record({
      label: 'addLayer',
      prevProject: prev,
      nextProject: next,
      prevSelectedCutIndex: prevIdx,
      nextSelectedCutIndex: prevIdx,
      ...composeSwaps(swaps),
    });
  };

  /** Crop: カットのキャンバスをリサイズ（PSD 再書き込み + 全レイヤー canvas。拡大時のみ cover カメラ付与 / native・縮小時は cameraWork を消す） */
  const resizeCanvas = async (cutIndex: number, size: FrameSize) => {
    const cut = project.cuts[cutIndex];
    if (!cut?.psd) return;
    const psd = psdCache[cut.psd];
    if (!psd) return;
    const prev = project;
    const prevIdx = selectedCutIndex;
    const { psd: nextPsd, buffer } = resizeDocPsd(psd, size.width, size.height);
    const swaps: FileSwap[] = [];
    if (storage.capabilities.write) {
      const preToken = await storage.trashFile(cut.psd);
      await storage.writeFile(cut.psd, buffer);
      swaps.push(makeOverwriteSwap(cut.psd, preToken));
    }
    await setPsdCache({ ...psdCache, [cut.psd]: nextPsd });
    const next = resizeCutCanvas(project, cutIndex, size, frame);
    await setProject(next);
    if (!storage.capabilities.write) {
      clearHistory();
      return;
    }
    record({
      label: 'resizeCanvas',
      prevProject: prev,
      nextProject: next,
      prevSelectedCutIndex: prevIdx,
      nextSelectedCutIndex: prevIdx,
      ...composeSwaps(swaps),
    });
  };

  /** New Scene: ネイティブ解像度で新カットを生成し、新シーン開始としてマークする */
  const addSceneCut = async () => {
    const prev = project;
    const prevIdx = selectedCutIndex;
    const size = { ...frame };
    const { psd, buffer } = createTemplatePsd(size.width, size.height);
    const psdName = nextPsdName(prev);
    if (storage.capabilities.write) {
      await storage.writeFile(psdName, buffer);
    }
    await setPsdCache({ ...psdCache, [psdName]: psd });
    const next = appendSceneCut(prev, psdName, size, fps * 3);
    await setProject(next);
    record({
      label: 'addSceneCut',
      prevProject: prev,
      nextProject: next,
      prevSelectedCutIndex: prevIdx,
      nextSelectedCutIndex: prevIdx,
      diskRevert: makeCreatePsdRevert(psdName),
      diskReapply: makeCreatePsdReapply(psdName, size.width, size.height),
    });
  };

  /** 🔗 結合: 隣接する index と index+1 のカットを統合（splitの逆＝リカバリー操作）。
   *  「中身のあるレイヤーだけ積む」方針:
   *  - 下CUT(B)に描画があり composite 可能なら、従来通り mergePsd で上CUT(A)へ連結し mergeCuts でデータ結合。
   *  - 下CUT(B)が白紙、または composite 不能なら、空レイヤー/ghost を作らないよう **B を綺麗に除去するだけ**。 */
  const mergeCutWithNext = async (index: number) => {
    const a = project.cuts[index];
    const b = project.cuts[index + 1];
    if (!a || !b) return;
    const prev = project;
    const prevIdx = selectedCutIndex;

    const pa = a.psd ? psdCache[a.psd] : undefined;
    const pb = b.psd ? psdCache[b.psd] : undefined;
    const canComposite = !!(a.psd && b.psd && pa && pb && storage.capabilities.write);
    // キャッシュ未取得時も blank 扱い＝積まずに除去する安全側に倒す
    const bBlank = pb ? isBlankPsd(pb) : true;

    if (canComposite && !bBlank) {
      // 中身のある B を A の flipbook へ積む（従来経路）
      const { psd: mergedPsd, buffer } = mergePsd(pa!, pb!);
      const swaps: FileSwap[] = [];
      const preAToken = await storage.trashFile(a.psd!); // A の旧バイトを trash 退避
      await storage.writeFile(a.psd!, buffer); // A を合成結果で上書き
      swaps.push(makeOverwriteSwap(a.psd!, preAToken));
      const orphan = orphanedPsdAfterMerge(project, index);
      const nextCache = { ...psdCache, [a.psd!]: mergedPsd };
      if (orphan) {
        const orphanToken = await storage.trashFile(orphan);
        delete nextCache[orphan];
        swaps.push(makeDeleteSwap(orphan, orphanToken));
      }
      await setPsdCache(nextCache);
      const next = mergeCuts(project, index);
      await setProject(next);
      record({
        label: 'mergeCutWithNext',
        prevProject: prev,
        nextProject: next,
        prevSelectedCutIndex: prevIdx,
        nextSelectedCutIndex: prevIdx,
        ...composeSwaps(swaps),
      });
      return;
    }

    // 白紙 B または composite 不能: rows もレイヤーも増やさず B を綺麗に除去する。
    // deleteCutAt はシーンマーカーの再正規化込みの純粋関数。
    const next = deleteCutAt(project, index + 1);
    const swaps: FileSwap[] = [];
    if (b.psd) {
      const target = b.psd.toLowerCase();
      const stillReferenced = next.cuts.some((cut) => cut.psd?.toLowerCase() === target);
      if (!stillReferenced) {
        if (storage.capabilities.write) {
          const token = await storage.trashFile(b.psd);
          swaps.push(makeDeleteSwap(b.psd, token));
        }
        const nextCache = { ...psdCache };
        delete nextCache[b.psd];
        await setPsdCache(nextCache);
      }
    }
    await setProject(next);
    if (!storage.capabilities.write) {
      clearHistory();
      return;
    }
    record({
      label: 'mergeCutWithNext',
      prevProject: prev,
      nextProject: next,
      prevSelectedCutIndex: prevIdx,
      nextSelectedCutIndex: prevIdx,
      ...composeSwaps(swaps),
    });
  };

  /** 任意位置への CUT 挿入: index の直後にネイティブ解像度の単層CUTを挿入する（addCut の位置指定版） */
  const insertCut = async (index: number) => {
    const prev = project;
    const prevIdx = selectedCutIndex;
    const size = { ...frame };
    const { psd, buffer } = createTemplatePsd(size.width, size.height);
    const psdName = nextPsdName(prev);
    if (storage.capabilities.write) {
      await storage.writeFile(psdName, buffer);
    }
    await setPsdCache({ ...psdCache, [psdName]: psd });
    const next = insertCutAfter(prev, index, psdName, size, fps * 3);
    await setProject(next);
    record({
      label: 'insertCut',
      prevProject: prev,
      nextProject: next,
      prevSelectedCutIndex: prevIdx,
      nextSelectedCutIndex: prevIdx,
      diskRevert: makeCreatePsdRevert(psdName),
      diskReapply: makeCreatePsdReapply(psdName, size.width, size.height),
    });
  };

  /** CUT 削除: 対象 CUT を除去（最後の1CUTは残す）。孤立した PSD はディスク+キャッシュから掃除する */
  const deleteCut = async (index: number) => {
    const removed = project.cuts[index];
    if (!removed) return;
    const prev = project;
    const prevIdx = selectedCutIndex;
    const next = deleteCutAt(project, index);
    if (next === project) return; // 最後の1CUT等で削除されなかった
    const swaps: FileSwap[] = [];
    if (removed.psd) {
      const target = removed.psd.toLowerCase();
      const stillReferenced = next.cuts.some((cut) => cut.psd?.toLowerCase() === target);
      if (!stillReferenced) {
        if (storage.capabilities.write) {
          const token = await storage.trashFile(removed.psd);
          swaps.push(makeDeleteSwap(removed.psd, token));
        }
        const nextCache = { ...psdCache };
        delete nextCache[removed.psd];
        await setPsdCache(nextCache);
      }
    }
    const nextIdx = Math.min(prevIdx, Math.max(0, next.cuts.length - 1));
    await setProject(next);
    if (!storage.capabilities.write) {
      clearHistory();
      return;
    }
    record({
      label: 'deleteCut',
      prevProject: prev,
      nextProject: next,
      prevSelectedCutIndex: prevIdx,
      nextSelectedCutIndex: nextIdx,
      ...composeSwaps(swaps),
    });
  };

  /** シーン区切りを「追加」する（CUT 間ガター用）。既に sceneStart があれば何もしない。
   *  index0 は暗黙シーンなので no-op。解除は SceneBand の X に委ねる。 */
  const setSceneStartIfAbsent = (index: number) => {
    if (index <= 0) return;
    if (project.cuts[index]?.sceneStart) return;
    commit('addScene', setSceneStart(project, index, {}));
  };

  /** 分離: 複数レイヤーCUTの最終レイヤーを新規CUTへ切り出す（New Layer の逆） */
  const splitCutLastLayer = async (cutIndex: number) => {
    const cut = project.cuts[cutIndex];
    if (!cut?.psd || cut.rows.length < 2) return;
    const psd = psdCache[cut.psd];
    if (!psd) return;
    const prev = project;
    const prevIdx = selectedCutIndex;
    const { base, layer } = splitTopLayerPsd(psd);
    const newPsdName = nextPsdName(project);
    const swaps: FileSwap[] = [];
    if (storage.capabilities.write) {
      const preBaseToken = await storage.trashFile(cut.psd);
      await storage.writeFile(cut.psd, base.buffer);
      await storage.writeFile(newPsdName, layer.buffer);
      swaps.push(makeOverwriteSwap(cut.psd, preBaseToken));
      swaps.push(makeCreateSwap(newPsdName));
    }
    await setPsdCache({ ...psdCache, [cut.psd]: base.psd, [newPsdName]: layer.psd });
    const next = splitLastLayer(project, cutIndex, newPsdName, fps * 3);
    await setProject(next);
    if (!storage.capabilities.write) {
      clearHistory();
      return;
    }
    record({
      label: 'splitCutLastLayer',
      prevProject: prev,
      nextProject: next,
      prevSelectedCutIndex: prevIdx,
      nextSelectedCutIndex: prevIdx,
      ...composeSwaps(swaps),
    });
  };

  const setSceneTitleAt = (cutIndex: number, title: string) =>
    commit('sceneTitle', setSceneTitle(project, cutIndex, title), `sceneTitle:${cutIndex}`);
  const removeSceneStart = (cutIndex: number) =>
    commit('removeScene', setSceneStart(project, cutIndex, undefined));

  /** トランジション fade 種別を設定。Cross は相方CUTも同じ next に含めるため 1 トランザクションで undo される */
  const setFadeTypeAt = (index: number, side: FadeSide, type: FadeType | undefined) =>
    commit('transition', setFadeType(project, index, side, type), `transition:${index}:${side}`);
  /** トランジション fade 尺を設定。Cross は相方も追従し 1 トランザクションで undo される */
  const setFadeDurationAt = (index: number, side: FadeSide, duration: number) =>
    commit('transition', setFadeDuration(project, index, side, duration), `transition-dur:${index}:${side}`);

  return {
    setDialogue,
    setActionText,
    setTime,
    setAction,
    setCameraWork,
    addCut,
    addLayer,
    addSceneCut,
    setSceneTitleAt,
    removeSceneStart,
    setFadeTypeAt,
    setFadeDurationAt,
    resizeCanvas,
    mergeCutWithNext,
    splitCutLastLayer,
    insertCut,
    deleteCut,
    setSceneStartIfAbsent,
  };
};
