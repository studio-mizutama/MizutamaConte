// src/git/__tests__/pathFix.test.ts
// electron/pathFix.ts は process.env のみ依存（electron 非 import）ゆえ renderer スコープから相対 import 可能。
import { describe, it, expect, afterEach } from 'vitest';
import { mergePath, applyPathFix } from '../../../electron/pathFix';

describe('mergePath', () => {
  it('prepends extras that are absent from base', () => {
    // launchd 最小 PATH（GUI 起動時の実態）に Homebrew dir を補う＝本不具合の核
    const base = '/usr/bin:/bin:/usr/sbin:/sbin';
    const result = mergePath(base, ['/opt/homebrew/bin', '/usr/local/bin']);
    expect(result.split(':')).toEqual([
      '/opt/homebrew/bin',
      '/usr/local/bin',
      '/usr/bin',
      '/bin',
      '/usr/sbin',
      '/sbin',
    ]);
  });

  it('does not duplicate an extra already present in base (moves it to front)', () => {
    const base = '/usr/local/bin:/usr/bin:/bin';
    const result = mergePath(base, ['/opt/homebrew/bin', '/usr/local/bin']);
    expect(result.split(':')).toEqual(['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin']);
  });

  it('preserves order of base entries that are not extras', () => {
    const base = '/a:/b:/c';
    expect(mergePath(base, ['/x']).split(':')).toEqual(['/x', '/a', '/b', '/c']);
  });

  it('drops empty / whitespace-only segments', () => {
    const base = '/usr/bin::/bin: ';
    expect(mergePath(base, ['/opt/homebrew/bin']).split(':')).toEqual([
      '/opt/homebrew/bin',
      '/usr/bin',
      '/bin',
    ]);
  });

  it('returns just the extras when base is empty', () => {
    expect(mergePath('', ['/opt/homebrew/bin', '/usr/local/bin'])).toBe(
      '/opt/homebrew/bin:/usr/local/bin',
    );
  });

  it('dedupes repeated extras', () => {
    expect(mergePath('/bin', ['/opt/homebrew/bin', '/opt/homebrew/bin']).split(':')).toEqual([
      '/opt/homebrew/bin',
      '/bin',
    ]);
  });
});

describe('applyPathFix', () => {
  const original = process.env.PATH;
  afterEach(() => {
    process.env.PATH = original;
  });

  it('adds Homebrew/MacPorts dirs on darwin', () => {
    process.env.PATH = '/usr/bin:/bin:/usr/sbin:/sbin';
    applyPathFix('darwin');
    const dirs = (process.env.PATH ?? '').split(':');
    expect(dirs).toContain('/opt/homebrew/bin');
    expect(dirs).toContain('/usr/local/bin');
    expect(dirs).toContain('/opt/local/bin');
    expect(dirs[0]).toBe('/opt/homebrew/bin');
  });

  it('adds common dirs on linux', () => {
    process.env.PATH = '/usr/bin:/bin';
    applyPathFix('linux');
    const dirs = (process.env.PATH ?? '').split(':');
    expect(dirs).toContain('/usr/local/bin');
    expect(dirs).toContain('/snap/bin');
  });

  it('leaves PATH unchanged on win32 (already works there)', () => {
    process.env.PATH = 'C:\\Windows\\system32;C:\\Program Files\\Git\\cmd';
    applyPathFix('win32');
    expect(process.env.PATH).toBe('C:\\Windows\\system32;C:\\Program Files\\Git\\cmd');
  });
});
