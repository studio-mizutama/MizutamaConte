import { useGlobal } from 'reactn';
import { useProject } from 'hooks/useProject';
import { appendCut, appendLayer, appendSceneCut, mergeCuts, nextPsdName, resizeCutCanvas, splitLastLayer, setSceneStart, setSceneTitle, updateCutAt, updateDialogueAt } from 'project/actions';
import { defaultCanvasSize } from 'project/dimensions';
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

  /** 行追加: PSD 雛形を生成・保存し、カットを末尾に追加する */
  const addCut = async () => {
    const size = defaultCanvasSize(frame);
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

  /** Crop: カットのキャンバスをリサイズ（PSD 再書き込み + 全レイヤー canvas + cover カメラ） */
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

  /** New Scene: 既定解像度で新カットを生成し、新シーン開始としてマークする */
  const addSceneCut = async () => {
    const size = defaultCanvasSize(frame);
    const { psd, buffer } = createTemplatePsd(size.width, size.height);
    const psdName = nextPsdName(project);
    if (storage.capabilities.write) {
      await storage.writeFile(psdName, buffer);
    }
    await setPsdCache({ ...psdCache, [psdName]: psd });
    await setProject(appendSceneCut(project, psdName, size, fps * 3));
  };

  /** 🔗 結合: 隣接する index と index+1 のカットを統合（PSD 連結 + TIME 合算） */
  const mergeCutWithNext = async (index: number) => {
    const a = project.cuts[index];
    const b = project.cuts[index + 1];
    if (!a?.psd || !b?.psd) return;
    const pa = psdCache[a.psd];
    const pb = psdCache[b.psd];
    if (!pa || !pb) return;
    const { psd: mergedPsd, buffer } = mergePsd(pa, pb);
    if (storage.capabilities.write) {
      await storage.writeFile(a.psd, buffer);
    }
    await setPsdCache({ ...psdCache, [a.psd]: mergedPsd });
    await setProject(mergeCuts(project, index));
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
    addCut,
    addLayer,
    addSceneCut,
    setSceneTitleAt,
    removeSceneStart,
    resizeCanvas,
    mergeCutWithNext,
    splitCutLastLayer,
  };
};
