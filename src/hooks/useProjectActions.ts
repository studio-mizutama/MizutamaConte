import { useGlobal } from 'reactn';
import { useProject } from 'hooks/useProject';
import { appendCut, nextPsdName, updateCutAt, updateDialogueAt } from 'project/actions';
import { defaultCanvasSize } from 'project/dimensions';
import { createTemplatePsd } from 'psd/template';
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

  return { setDialogue, setActionText, setTime, addCut };
};
