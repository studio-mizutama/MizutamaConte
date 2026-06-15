/** git/git-lfs 導入コマンドの 1 行（ラベル＋コピー対象コマンド）。 */
export interface InstallCommand {
  label: string;
  command: string;
}

/**
 * 現在 OS（GitDetect.platform = process.platform）に対応する git/git-lfs 導入コマンドを返す。
 * コピーは UI 側で navigator.clipboard.writeText(command)（IPC 不要・renderer 完結）。
 */
export const installCommands = (platform: string): InstallCommand[] => {
  if (platform === 'darwin') return [{ label: 'Homebrew', command: 'brew install git git-lfs' }];
  if (platform === 'win32') return [{ label: 'winget', command: 'winget install Git.Git' }]; // git-lfs 同梱
  return [
    { label: 'apt (Debian/Ubuntu)', command: 'sudo apt install git git-lfs' },
    { label: 'dnf (Fedora)', command: 'sudo dnf install git git-lfs' },
  ];
};
