import { AppSettings } from 'project/types';

/** アプリ全体設定の永続化（クロスプラットフォーム）。
 *  Electron: settings.json（window.api 経由）／ Web: localStorage。
 *  保存は常に既存設定へマージするため、whole-object 上書きで他フィールドを失う事故を防ぐ。 */

const LS_KEY = 'mizutama:settings';

const readLocal = (): AppSettings => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as AppSettings) : {};
  } catch {
    return {};
  }
};

const writeLocal = (settings: AppSettings): void => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(settings));
  } catch {
    // localStorage 不可（プライベートモード等）では黙って無視する
  }
};

/** Web の localStorage から同期で読む（boot 時の初期 locale/theme 推定用）。Electron では空を返す。 */
export const readAppSettingsSync = (): AppSettings => (window.api ? {} : readLocal());

/** アプリ設定を読み込む。 */
export const loadAppSettings = async (): Promise<AppSettings> => {
  if (window.api) return window.api.loadSettings();
  return readLocal();
};

/** 既存設定へ patch をマージして保存する。 */
export const saveAppSettings = async (patch: Partial<AppSettings>): Promise<void> => {
  const current = await loadAppSettings();
  const merged: AppSettings = { ...current, ...patch };
  if (window.api) {
    await window.api.saveSettings(merged);
  } else {
    writeLocal(merged);
  }
};
