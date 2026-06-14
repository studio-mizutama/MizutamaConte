import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface AppSettings {
  paintApp?: {
    mode?: 'auto' | 'custom';
    customPath?: string;
  };
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
