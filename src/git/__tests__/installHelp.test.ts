import { describe, it, expect } from 'vitest';
import { installCommands } from '../installHelp';

describe('installCommands', () => {
  it('returns Homebrew command on darwin', () => {
    const cmds = installCommands('darwin');
    expect(cmds).toEqual([{ label: 'Homebrew', command: 'brew install git git-lfs' }]);
  });

  it('returns winget command on win32 (git-lfs 同梱)', () => {
    const cmds = installCommands('win32');
    expect(cmds).toEqual([{ label: 'winget', command: 'winget install Git.Git' }]);
  });

  it('returns apt and dnf commands on other platforms (linux 等)', () => {
    const cmds = installCommands('linux');
    expect(cmds).toEqual([
      { label: 'apt (Debian/Ubuntu)', command: 'sudo apt install git git-lfs' },
      { label: 'dnf (Fedora)', command: 'sudo dnf install git git-lfs' },
    ]);
  });

  it('falls back to linux commands for unknown platform strings', () => {
    expect(installCommands('freebsd')).toEqual([
      { label: 'apt (Debian/Ubuntu)', command: 'sudo apt install git git-lfs' },
      { label: 'dnf (Fedora)', command: 'sudo dnf install git git-lfs' },
    ]);
  });
});
