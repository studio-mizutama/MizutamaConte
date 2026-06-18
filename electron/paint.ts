import { shell } from 'electron';
import { spawn, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { loadSettings } from './settings';

/** /Applications 内で prefix に一致する .app を探す（Photoshop 2024 等の年次フォルダ対応） */
const findMacAppByPrefix = (prefix: string): string | null => {
  try {
    const entries = fs.readdirSync('/Applications');
    const hit = entries.filter((name) => name.startsWith(prefix)).sort().reverse()[0];
    if (!hit) return null;
    const appDir = path.join('/Applications', hit);
    if (hit.endsWith('.app')) return appDir;
    // "Adobe Photoshop 2024/Adobe Photoshop 2024.app" 形式
    const inner = fs.readdirSync(appDir).find((name) => name.endsWith('.app'));
    return inner ? path.join(appDir, inner) : null;
  } catch {
    return null;
  }
};

const findWinAppByGlob = (dir: string, exeName: string): string | null => {
  try {
    const entries = fs.readdirSync(dir);
    for (const entry of entries.sort().reverse()) {
      const candidate = path.join(dir, entry, exeName);
      if (fs.existsSync(candidate)) return candidate;
    }
  } catch {
    /* ignore */
  }
  return null;
};

const which = (bin: string): string | null => {
  const result = spawnSync('which', [bin], { encoding: 'utf8' });
  const found = result.stdout?.trim();
  return result.status === 0 && found ? found : null;
};

/** 優先順: CLIP STUDIO PAINT → Photoshop → Affinity → GIMP → Krita */
export const findPaintApp = (): { kind: 'mac-app' | 'exe'; path: string } | null => {
  if (process.platform === 'darwin') {
    const candidates = [
      // CLIP STUDIO 1.5/1.0 は "CLIP STUDIO x.x/App/CLIP STUDIO PAINT.app" 構成
      '/Applications/CLIP STUDIO 1.5/App/CLIP STUDIO PAINT.app',
      '/Applications/CLIP STUDIO 1.0/App/CLIP STUDIO PAINT.app',
      '/Applications/CLIP STUDIO PAINT.app',
      findMacAppByPrefix('Adobe Photoshop'),
      findMacAppByPrefix('Affinity Photo'),
      findMacAppByPrefix('GIMP'),
      '/Applications/krita.app',
    ];
    for (const candidate of candidates) {
      if (candidate && fs.existsSync(candidate)) return { kind: 'mac-app', path: candidate };
    }
    return null;
  }
  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\CELSYS\\CLIP STUDIO 1.5\\CLIP STUDIO PAINT\\CLIPStudioPaint.exe',
      'C:\\Program Files\\CELSYS\\CLIP STUDIO 1.0\\CLIP STUDIO PAINT\\CLIPStudioPaint.exe',
      findWinAppByGlob('C:\\Program Files\\Adobe', 'Photoshop.exe'),
      'C:\\Program Files\\Affinity\\Photo 2\\Photo.exe',
      findWinAppByGlob('C:\\Program Files\\GIMP 2\\bin', ''),
      'C:\\Program Files\\Krita (x64)\\bin\\krita.exe',
    ];
    for (const candidate of candidates) {
      if (candidate && fs.existsSync(candidate)) return { kind: 'exe', path: candidate };
    }
    return null;
  }
  // Linux: CSP/Photoshop は存在しないため krita → gimp
  const bin = which('krita') || which('gimp');
  return bin ? { kind: 'exe', path: bin } : null;
};

/** PSD を優先ペイントアプリで開く。見つからなければ OS 既定アプリにフォールバック */
export const openInPaintApp = async (psdPath: string): Promise<{ ok: boolean; app?: string; error?: string }> => {
  const settings = loadSettings();
  const custom = settings.paintApp?.mode === 'custom' ? settings.paintApp.customPath : undefined;

  let target: { kind: 'mac-app' | 'exe'; path: string } | null = null;
  if (custom && fs.existsSync(custom)) {
    target = { kind: process.platform === 'darwin' && custom.endsWith('.app') ? 'mac-app' : 'exe', path: custom };
  } else {
    target = findPaintApp();
  }

  if (!target) {
    const result = await shell.openPath(psdPath);
    return result ? { ok: false, error: result } : { ok: true, app: 'OS default' };
  }
  try {
    if (target.kind === 'mac-app') {
      spawn('open', ['-a', target.path, psdPath], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn(target.path, [psdPath], { detached: true, stdio: 'ignore' }).unref();
    }
    return { ok: true, app: target.path };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
};
