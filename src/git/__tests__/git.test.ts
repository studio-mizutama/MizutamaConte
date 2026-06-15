// src/git/__tests__/git.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
// electron/git.ts は node builtin のみ依存ゆえ renderer スコープから相対 import 可能
import { detect, isRepo, initRepo, status, commit, logLatest } from '../../../electron/git';

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mzc-git-'));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('detect', () => {
  it('reports git and git-lfs as installed on this machine', async () => {
    const result = await detect();
    expect(result.hasGit).toBe(true);
    expect(result.hasLfs).toBe(true);
    expect(typeof result.platform).toBe('string');
    expect(result.platform.length).toBeGreaterThan(0);
  });
});

describe('isRepo / initRepo', () => {
  it('returns false before init and true after init', async () => {
    expect(await isRepo(dir)).toBe(false);
    await initRepo(dir);
    expect(await isRepo(dir)).toBe(true);
  });

  it('writes .gitignore and .gitattributes verbatim', async () => {
    await initRepo(dir);
    const gitignore = fs.readFileSync(path.join(dir, '.gitignore'), 'utf8');
    const gitattributes = fs.readFileSync(path.join(dir, '.gitattributes'), 'utf8');
    expect(gitignore).toBe('.DS_Store\n*.pdf\n*.mp4\n*.mov\n');
    expect(gitattributes).toBe('*.psd filter=lfs diff=lfs merge=lfs -text\n');
  });

  it('creates an initial commit during init', async () => {
    await initRepo(dir);
    const entry = await logLatest(dir);
    expect(entry).not.toBeNull();
    expect(entry?.subject).toBe('Initial commit (Mizutama Conte)');
  });
});

describe('status', () => {
  it('is clean right after init and dirty after an untracked file', async () => {
    await initRepo(dir);
    expect((await status(dir)).dirty).toBe(false);
    fs.writeFileSync(path.join(dir, 'note.txt'), 'hello', 'utf8');
    expect((await status(dir)).dirty).toBe(true);
  });
});

describe('commit / logLatest', () => {
  it('returns the latest subject after add + commit', async () => {
    await initRepo(dir);
    fs.writeFileSync(path.join(dir, 'a.txt'), 'content', 'utf8');
    await commit(dir, 'snapshot one');
    const entry = await logLatest(dir);
    expect(entry?.subject).toBe('snapshot one');
    expect(entry?.hash.length).toBeGreaterThan(0);
    expect(entry?.date.length).toBeGreaterThan(0);
    // commit 後は dirty 解消
    expect((await status(dir)).dirty).toBe(false);
  });

  it('returns null for a repo without any commit', async () => {
    // init せず git init のみ（コミット無し）
    await initRepoBare(dir);
    expect(await logLatest(dir)).toBeNull();
  });
});

// logLatest の null 分岐確認用: git init のみ（commit 無し）の最小セットアップ
async function initRepoBare(target: string): Promise<void> {
  const { execFile } = await import('child_process');
  const { promisify } = await import('util');
  const run = promisify(execFile);
  await run('git', ['init'], { cwd: target });
}
