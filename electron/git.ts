// electron/git.ts
// git バージョン管理（main 専用）。child_process.execFile を promisify して使う。
// シェル経由は使わない（引数は必ず配列で渡す）。
// NOTE: src/ を import できない（main/renderer の tsconfig 分離）。戻り値の形は
//       src/git/types.ts の GitDetect/GitLogEntry と一致させるが、型は本ファイルに閉じる。
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const run = promisify(execFile);

/** git/git-lfs の導入状況（src/git/types.ts の GitDetect と同形） */
interface GitDetect {
  hasGit: boolean;
  hasLfs: boolean;
  platform: string;
}

/** `git log -1` の最小情報（src/git/types.ts の GitLogEntry と同形） */
interface GitLogEntry {
  hash: string;
  date: string;
  subject: string;
}

/** コミットがグローバル user.name/email に依存しないよう identity を前置する */
const IDENTITY = [
  '-c',
  'user.name=Mizutama Conte',
  '-c',
  'user.email=conte@studio-mizutama.invalid',
];

const GITIGNORE = '.DS_Store\n*.pdf\n*.mp4\n*.mov\n.trash/\n';
const GITATTRIBUTES = '*.psd filter=lfs diff=lfs merge=lfs -text\n';

/** git 本体の存在を成否で判定（dir 不要） */
const hasGit = async (): Promise<boolean> => {
  try {
    await run('git', ['--version']);
    return true;
  } catch {
    return false;
  }
};

/** git-lfs の存在を成否で判定（dir 不要） */
const hasLfs = async (): Promise<boolean> => {
  try {
    await run('git', ['lfs', 'version']);
    return true;
  } catch {
    return false;
  }
};

/** git / git-lfs の導入状況とプラットフォームを返す（起動時 1 回） */
export const detect = async (): Promise<GitDetect> => {
  const [git, lfs] = await Promise.all([hasGit(), hasLfs()]);
  return { hasGit: git, hasLfs: lfs, platform: process.platform };
};

/** dir が git 作業ツリー内かを判定する */
export const isRepo = async (dir: string): Promise<boolean> => {
  try {
    const { stdout } = await run('git', ['rev-parse', '--is-inside-work-tree'], { cwd: dir });
    return stdout.trim() === 'true';
  } catch {
    return false;
  }
};

/**
 * git 管理を初期化する。順序は固定（contract C-5）:
 * git init → .gitignore/.gitattributes 書込 → git lfs install --local → git add . → 初期コミット。
 */
export const initRepo = async (dir: string): Promise<void> => {
  await run('git', ['init'], { cwd: dir });
  fs.writeFileSync(path.join(dir, '.gitignore'), GITIGNORE, 'utf8');
  fs.writeFileSync(path.join(dir, '.gitattributes'), GITATTRIBUTES, 'utf8');
  await run('git', ['lfs', 'install', '--local'], { cwd: dir });
  await run('git', ['add', '.'], { cwd: dir });
  await run('git', [...IDENTITY, 'commit', '-m', 'Initial commit (Mizutama Conte)'], { cwd: dir });
};

/** 作業ツリーに未コミットの変更があれば dirty=true */
export const status = async (dir: string): Promise<{ dirty: boolean }> => {
  const { stdout } = await run('git', ['status', '--porcelain'], { cwd: dir });
  return { dirty: stdout.trim().length > 0 };
};

/** すべてをステージしてスナップショットを作る（git add . && git commit -m message） */
export const commit = async (dir: string, message: string): Promise<void> => {
  await run('git', ['add', '.'], { cwd: dir });
  await run('git', [...IDENTITY, 'commit', '-m', message], { cwd: dir });
};

/** 最新コミットの hash/date/subject を返す。コミットが無ければ null */
export const logLatest = async (dir: string): Promise<GitLogEntry | null> => {
  try {
    const { stdout } = await run(
      'git',
      ['log', '-1', '--format=%H%x1f%cI%x1f%s'],
      { cwd: dir },
    );
    const line = stdout.trim();
    if (!line) return null;
    const [hash, date, subject] = line.split('\x1f');
    return { hash, date, subject };
  } catch {
    // コミットが 1 つも無い repo は git log が非ゼロ終了する
    return null;
  }
};
