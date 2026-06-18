import { useGlobal } from 'reactn';
import type { ChangeEvent } from 'react';
import { parseScript } from 'project/scriptImport';
import { translate } from 'i18n';

const MAX_SCRIPT_BYTES = 5_000_000; // 5MB 上限（巨大ファイルでのハングを防ぐ）

const stripExtension = (name: string): string => name.replace(/\.[^.]+$/, '');

/** 脚本インポートの配線。ファイル内容を受け取り、パース・検証して
 *  成功なら scriptImport をセットして新規ダイアログを開く。失敗は loadError に集約（落とさない）。 */
export const useImportScript = () => {
  const setScriptImport = useGlobal('scriptImport')[1];
  const setNewProjectOpen = useGlobal('newProjectOpen')[1];
  const setLoadError = useGlobal('loadError')[1];
  const locale = useGlobal('locale')[0];

  const fail = (): void => {
    void setLoadError(translate(locale, 'error.importBody'));
  };

  const runImport = (picked: { name: string; content: string } | null): void => {
    if (!picked) return; // キャンセル
    if (picked.content.length > MAX_SCRIPT_BYTES) return fail();
    let parsed;
    try {
      parsed = parseScript(picked.content, stripExtension(picked.name));
    } catch {
      return fail();
    }
    if (parsed.cuts.length === 0) return fail();
    setScriptImport(parsed);
    setNewProjectOpen(true);
  };

  /** Electron: メニュー → ネイティブのファイル選択ダイアログ */
  const pickFromElectron = async (): Promise<void> => {
    const api = window.api;
    if (!api?.openScript) return;
    try {
      runImport(await api.openScript());
    } catch {
      fail();
    }
  };

  /** Web: hidden input の onChange ハンドラ */
  const loadScriptFile = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 同一ファイルの再選択を許可
    if (!file) return;
    try {
      const content = await file.text();
      runImport({ name: file.name, content });
    } catch {
      fail();
    }
  };

  return { runImport, pickFromElectron, loadScriptFile };
};
