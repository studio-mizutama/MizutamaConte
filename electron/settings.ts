import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

// NOTE: renderer 側の同型 `src/project/types.ts` の AppSettings と構造を一致させること
// （main/renderer は tsconfig が分かれており import で共有できないため意図的に二重定義）。
export interface AppSettings {
  paintApp?: {
    mode?: 'auto' | 'custom';
    customPath?: string;
  };
  /** UI 言語。未設定時は 'ja'（日本語ファースト） */
  language?: 'ja' | 'ko' | 'en';
  /** テーマ。'system' は OS 設定に追従。未設定時は 'system' */
  theme?: 'light' | 'dark' | 'system';
  /** 最近開いたプロジェクト（新しい順・cap 10・id で dedupe） */
  recentProjects?: RecentProject[];
}

export interface RecentProject {
  /** 安定キー（Electron=絶対パス / Web=生成 id） */
  id: string;
  /** 表示名（フォルダ名） */
  name: string;
  /** Electron の絶対パス（Web は undefined） */
  path?: string;
  /** 最終オープン時刻（epoch ms） */
  timestamp: number;
}

const settingsPath = (): string => path.join(app.getPath('userData'), 'settings.json');

export const loadSettings = (): AppSettings => {
  try {
    return JSON.parse(fs.readFileSync(settingsPath(), 'utf8')) as AppSettings;
  } catch {
    return {};
  }
};

export const saveSettings = (settings: AppSettings): void => {
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), 'utf8');
};
