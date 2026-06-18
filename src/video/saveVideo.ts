/**
 * 書き出した MP4 を出力する。
 * Electron（window.api あり）= 保存ダイアログ（IPC）。Web = ブラウザダウンロード。
 */
export const downloadOrSaveVideo = async (bytes: Uint8Array, baseName: string): Promise<void> => {
  const fileName = `${baseName || 'conte'}.mp4`;
  if (window.api?.saveVideo) {
    await window.api.saveVideo(fileName, bytes);
    return;
  }
  const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'video/mp4' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 大きな blob でも確実にダウンロードさせるため revoke を遅延
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};
