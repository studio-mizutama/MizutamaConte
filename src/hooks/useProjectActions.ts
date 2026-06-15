import { useGlobal } from 'reactn';
import { useProject } from 'hooks/useProject';
import { appendCut, appendLayer, appendSceneCut, deleteCutAt, insertCutAfter, mergeCuts, nextPsdName, orphanedPsdAfterMerge, resizeCutCanvas, splitLastLayer, setSceneStart, setSceneTitle, updateCutAt, updateDialogueAt } from 'project/actions';
import { createTemplatePsd, appendLayerToPsd, mergePsd, resizeDocPsd, splitTopLayerPsd } from 'psd/template';
import { FrameSize } from 'project/types';
import { getStorage } from 'storage';

/** Edit 画面からのプロジェクト編集操作。変更は自動保存 (useAutoSave) が拾う */
export const useProjectActions = () => {
  const { project, setProject, frame, fps } = useProject();
  const [psdCache, setPsdCache] = useGlobal('psdCache');
  const storage = getStorage();

  const setDialogue = (index: number, dialogue: string) => setProject(updateDialogueAt(project, index, dialogue));

  const setActionText = (index: number, text: string) =>
    setProject(updateCutAt(project, index, { action: { ...project.cuts[index]?.action, text } }));

  const setTime = (index: number, time: number) => setProject(updateCutAt(project, index, { time }));

  const setAction = (index: number, action: Action) => setProject(updateCutAt(project, index, { action }));

  const setCameraWork = (index: number, cameraWork: CameraWork) =>
    setProject(updateCutAt(project, index, { cameraWork }));

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

  /** 🔗 結合: 隣接する index と index+1 のカットを統合（PSD 連結 + TIME 合算）。
   *  データ結合(mergeCuts)は psd/キャッシュの有無に関わらず必ず実行する＝空行が残るバグの根治。
   *  PSD 合成(mergePsd)＋孤立PSD掃除は素材が揃うときだけの best-effort。 */
  const mergeCutWithNext = async (index: number) => {
    const a = project.cuts[index];
    const b = project.cuts[index + 1];
    // 範囲外（隣接 CUT が存在しない）ときのみ早期 return
    if (!a || !b) return;

    const pa = a.psd ? psdCache[a.psd] : undefined;
    const pb = b.psd ? psdCache[b.psd] : undefined;
    // mergePsd で下CUTの内容は上CUTへコピーされるため、結合後に孤立する下CUTの PSD は掃除対象
    const orphan = orphanedPsdAfterMerge(project, index);

    // PSD 合成が可能なケース（両 PSD・両キャッシュ・書込可）だけ実際に合成して上CUTへ書き戻す
    const canMergePsd = !!(a.psd && b.psd && pa && pb && storage.capabilities.write);
    const nextCache = { ...psdCache };
    if (canMergePsd) {
      const { psd: mergedPsd, buffer } = mergePsd(pa!, pb!);
      await storage.writeFile(a.psd!, buffer);
      nextCache[a.psd!] = mergedPsd;
    }
    // 孤立しうる下CUT PSD の掃除は素材が揃わなくても best-effort で行う
    if (orphan) {
      if (storage.capabilities.write) await storage.deleteFile(orphan).catch(() => undefined);
      delete nextCache[orphan];
    }
    await setPsdCache(nextCache);

    // データ結合は必ず到達させる（下CUTを除去＝番号が繰り上がり、空行が消える）
    await setProject(mergeCuts(project, index));
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

  /** シーン区切りトグル: sceneStart があれば解除、無ければ空マーカー（無題境界）を付与。
   *  index0 は常に暗黙シーンなのでトグル不可（no-op）。 */
  const toggleSceneBreak = (index: number) => {
    if (index <= 0) return;
    const has = !!project.cuts[index]?.sceneStart;
    setProject(setSceneStart(project, index, has ? undefined : {}));
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

  const setSceneTitleAt = (cutIndex: number, title: string) => setProject(setSceneTitle(project, cutIndex, title));
  const removeSceneStart = (cutIndex: number) => setProject(setSceneStart(project, cutIndex, undefined));

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
    toggleSceneBreak,
  };
};
