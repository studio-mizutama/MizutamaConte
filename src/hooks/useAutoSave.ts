import { useEffect, useCallback, useGlobal } from 'reactn';
import { useHotkeys } from 'react-hotkeys-hook';
import { useProject } from 'hooks/useProject';
import { serializeProject, getLastPersisted, setLastPersisted, takePendingV1Backup } from 'project/save';
import { getStorage } from 'storage';

const AUTO_SAVE_DELAY_MS = 1500;

/**
 * プロジェクト変更を監視して JSON を自動保存する。
 * - 変更後 1.5 秒デバウンスで保存、Cmd/Ctrl+S で即時保存
 * - v1 から移行したプロジェクトは初回保存時に元 JSON を .v1.bak へ退避
 */
export const useAutoSave = (): 'idle' | 'dirty' | 'saving' | 'saved' | 'error' => {
  const { project } = useProject();
  const fileName = useGlobal('globalFileName')[0];
  const [saveState, setSaveState] = useGlobal('saveState');
  const storage = getStorage();

  const save = useCallback(async () => {
    if (!fileName || !storage.capabilities.write) return;
    const text = serializeProject(project);
    if (text === getLastPersisted()) return;
    await setSaveState('saving');
    try {
      const backup = takePendingV1Backup();
      if (backup && !(await storage.exists(backup.name))) {
        await storage.writeFile(backup.name, backup.text);
      }
      await storage.writeFile(fileName, text);
      setLastPersisted(text);
      setSaveState('saved');
    } catch (err) {
      console.error('保存に失敗しました', err);
      setSaveState('error');
    }
  }, [project, fileName, storage, setSaveState]);

  useEffect(() => {
    if (!fileName || !storage.capabilities.write) return;
    if (serializeProject(project) === getLastPersisted()) {
      // 内容がディスクと一致しているのに dirty 表示が残っていたら解消する
      if (saveState === 'dirty') setSaveState('saved');
      return;
    }
    setSaveState('dirty');
    const timer = setTimeout(save, AUTO_SAVE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, fileName, save, saveState]);

  useHotkeys(
    'command+s,ctrl+s',
    (event) => {
      event.preventDefault();
      save();
    },
    [save],
  );

  return saveState;
};
