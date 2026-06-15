import { useGlobal } from 'reactn';
import { useProject } from 'hooks/useProject';
import { appendCut, appendLayer, appendSceneCut, deleteCutAt, insertCutAfter, mergeCuts, nextPsdName, orphanedPsdAfterMerge, resizeCutCanvas, splitLastLayer, setSceneStart, setSceneTitle, updateCutAt, updateDialogueAt } from 'project/actions';
import { createTemplatePsd, appendLayerToPsd, mergePsd, resizeDocPsd, splitTopLayerPsd, isBlankPsd } from 'psd/template';
import { ProjectFile, FrameSize } from 'project/types';
import { getStorage } from 'storage';
import { record } from 'history/undoManager';

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
    const size = { ...frame };
    const { psd, buffer } = createTemplatePsd(size.width, size.height);
    const psdName = nextPsdName(project);
    if (storage.capabilities.write) {
      await storage.writeFile(psdName, buffer);
    }
    await setPsdCache({ ...psdCache, [psdName]: psd });
    await setProject(appendCut(project, psdName, size, fps * 3));
  };

  /** New Layer: 現在のカットへ透明レイヤーを追記し、行を追加する */
  const addLayer = async (cutIndex: number) => {
    const cut = project.cuts[cutIndex];
    if (!cut?.psd) return;
    const psd = psdCache[cut.psd];
    if (!psd) return;
    const { psd: nextPsd, buffer } = appendLayerToPsd(psd, String(cut.rows.length + 1));
    if (storage.capabilities.write) {
      await storage.writeFile(cut.psd, buffer);
    }
    await setPsdCache({ ...psdCache, [cut.psd]: nextPsd });
    await setProject(appendLayer(project, cutIndex));
  };

  /** Crop: カットのキャンバスをリサイズ（PSD 再書き込み + 全レイヤー canvas。拡大時のみ cover カメラ付与 / native・縮小時は cameraWork を消す） */
  const resizeCanvas = async (cutIndex: number, size: FrameSize) => {
    const cut = project.cuts[cutIndex];
    if (!cut?.psd) return;
    const psd = psdCache[cut.psd];
    if (!psd) return;
    const { psd: nextPsd, buffer } = resizeDocPsd(psd, size.width, size.height);
    if (storage.capabilities.write) {
      await storage.writeFile(cut.psd, buffer);
    }
    await setPsdCache({ ...psdCache, [cut.psd]: nextPsd });
    await setProject(resizeCutCanvas(project, cutIndex, size, frame));
  };

  /** New Scene: ネイティブ解像度で新カットを生成し、新シーン開始としてマークする */
  const addSceneCut = async () => {
    const size = { ...frame };
    const { psd, buffer } = createTemplatePsd(size.width, size.height);
    const psdName = nextPsdName(project);
    if (storage.capabilities.write) {
      await storage.writeFile(psdName, buffer);
    }
    await setPsdCache({ ...psdCache, [psdName]: psd });
    await setProject(appendSceneCut(project, psdName, size, fps * 3));
  };

  /** 🔗 結合: 隣接する index と index+1 のカットを統合（splitの逆＝リカバリー操作）。
   *  「中身のあるレイヤーだけ積む」方針:
   *  - 下CUT(B)に描画があり composite 可能なら、従来通り mergePsd で上CUT(A)へ連結し mergeCuts でデータ結合。
   *  - 下CUT(B)が白紙、または composite 不能なら、空レイヤー/ghost を作らないよう **B を綺麗に除去するだけ**。 */
  const mergeCutWithNext = async (index: number) => {
    const a = project.cuts[index];
    const b = project.cuts[index + 1];
    // 範囲外（隣接 CUT が存在しない）ときのみ早期 return
    if (!a || !b) return;

    const pa = a.psd ? psdCache[a.psd] : undefined;
    const pb = b.psd ? psdCache[b.psd] : undefined;
    const canComposite = !!(a.psd && b.psd && pa && pb && storage.capabilities.write);
    // キャッシュ未取得時も blank 扱い＝積まずに除去する安全側に倒す
    const bBlank = pb ? isBlankPsd(pb) : true;

    if (canComposite && !bBlank) {
      // 中身のある B を A の flipbook へ積む（従来経路）
      const { psd: mergedPsd, buffer } = mergePsd(pa!, pb!);
      await storage.writeFile(a.psd!, buffer);
      // 連結で孤立する下CUTの PSD は掃除（内容は A へコピー済みなので削除安全）
      const orphan = orphanedPsdAfterMerge(project, index);
      const nextCache = { ...psdCache, [a.psd!]: mergedPsd };
      if (orphan) {
        await storage.deleteFile(orphan).catch(() => undefined);
        delete nextCache[orphan];
      }
      await setPsdCache(nextCache);
      // レイヤー数と rows が一致した状態でデータ結合（空レイヤーが出ない）
      await setProject(mergeCuts(project, index));
      return;
    }

    // 白紙 B または composite 不能: rows もレイヤーも増やさず B を綺麗に除去する。
    // deleteCutAt はシーンマーカーの再正規化込みの純粋関数。
    const next = deleteCutAt(project, index + 1);
    // 下CUTの PSD が結果のどの cut からも参照されなくなったら掃除（大小無視で保守的に判定）
    if (b.psd) {
      const target = b.psd.toLowerCase();
      const stillReferenced = next.cuts.some((cut) => cut.psd?.toLowerCase() === target);
      if (!stillReferenced) {
        if (storage.capabilities.write) await storage.deleteFile(b.psd).catch(() => undefined);
        const nextCache = { ...psdCache };
        delete nextCache[b.psd];
        await setPsdCache(nextCache);
      }
    }
    await setProject(next);
  };

  /** 任意位置への CUT 挿入: index の直後にネイティブ解像度の単層CUTを挿入する（addCut の位置指定版） */
  const insertCut = async (index: number) => {
    const size = { ...frame };
    const { psd, buffer } = createTemplatePsd(size.width, size.height);
    const psdName = nextPsdName(project);
    if (storage.capabilities.write) {
      await storage.writeFile(psdName, buffer);
    }
    await setPsdCache({ ...psdCache, [psdName]: psd });
    await setProject(insertCutAfter(project, index, psdName, size, fps * 3));
  };

  /** CUT 削除: 対象 CUT を除去（最後の1CUTは残す）。孤立した PSD はディスク+キャッシュから掃除する */
  const deleteCut = async (index: number) => {
    const removed = project.cuts[index];
    if (!removed) return;
    const next = deleteCutAt(project, index);
    // length<=1 などで削除されなかった（同一参照）なら何もしない
    if (next === project) return;
    // 削除 CUT の psd が結果のどの cut からも参照されなくなったら掃除（大小無視で保守的に判定）
    if (removed.psd) {
      const target = removed.psd.toLowerCase();
      const stillReferenced = next.cuts.some((cut) => cut.psd?.toLowerCase() === target);
      if (!stillReferenced) {
        if (storage.capabilities.write) await storage.deleteFile(removed.psd).catch(() => undefined);
        const nextCache = { ...psdCache };
        delete nextCache[removed.psd];
        await setPsdCache(nextCache);
      }
    }
    await setProject(next);
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
    const { base, layer } = splitTopLayerPsd(psd);
    const newPsdName = nextPsdName(project);
    if (storage.capabilities.write) {
      await storage.writeFile(cut.psd, base.buffer);
      await storage.writeFile(newPsdName, layer.buffer);
    }
    await setPsdCache({ ...psdCache, [cut.psd]: base.psd, [newPsdName]: layer.psd });
    await setProject(splitLastLayer(project, cutIndex, newPsdName, fps * 3));
  };

  const setSceneTitleAt = (cutIndex: number, title: string) =>
    commit('sceneTitle', setSceneTitle(project, cutIndex, title), `sceneTitle:${cutIndex}`);
  const removeSceneStart = (cutIndex: number) =>
    commit('removeScene', setSceneStart(project, cutIndex, undefined));

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
    resizeCanvas,
    mergeCutWithNext,
    splitCutLastLayer,
    insertCut,
    deleteCut,
    setSceneStartIfAbsent,
  };
};
