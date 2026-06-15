import { useGlobal } from 'reactn';

export type EditorMode = 'edit' | 'resize' | 'reorder';

/** editorMode グローバル（undefined 含む）を既定 'edit' へ解決する純粋関数 */
export const resolveEditorMode = (mode: EditorMode | undefined): EditorMode => mode ?? 'edit';

// 既定は 'edit'（テキスト常時編集可・クリックで CUT 選択）
export const useEditorMode = (): [EditorMode, (m: EditorMode) => void] => {
  const [mode, setMode] = useGlobal('editorMode');
  return [resolveEditorMode(mode), setMode];
};
