import { useGlobal } from 'reactn';
import { EditorMode, useEditorMode } from 'hooks/editorMode';

/** 編集操作（行追加・CUT 編集等）が可能かを判定する純粋関数。プロジェクト未オープン・edit 以外のモードでは不可 */
export const computeEditingEnabled = (fileName: string, editorMode: EditorMode): boolean =>
  Boolean(fileName) && editorMode === 'edit';

/** 編集可否（E/F 単一判定）。globalFileName と editorMode から導出する */
export const useEditingEnabled = (): boolean => {
  const fileName = useGlobal('globalFileName')[0];
  const [editorMode] = useEditorMode();
  return computeEditingEnabled(fileName ?? '', editorMode);
};
