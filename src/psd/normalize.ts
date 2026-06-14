import { Psd } from 'ag-psd';

/**
 * ペイントアプリ（CLIP STUDIO PAINT / Photoshop 等）は描画レイヤーを内容のバウンディング
 * ボックスへトリミングし、left/top オフセットで保存する。そのまま `child.canvas` の寸法で
 * 描画すると「色のついたピクセル」だけにクロップされて見えてしまう。
 *
 * これを防ぐため、各レイヤーをドキュメント全体サイズの canvas へ left/top オフセットで
 * 再配置し、作画の無い余白（絵コンテでは「どこに描かないか」も重要な情報）を保持する。
 *
 * Node 環境（vitest）や canvas 非対応では何もしない（document を参照しない）。
 */
export const normalizePsdLayers = (psd: Psd): Psd => {
  if (typeof document === 'undefined') return psd;
  const docW = psd.width;
  const docH = psd.height;
  if (!docW || !docH || !psd.children) return psd;

  const children = psd.children.map((child) => {
    const canvas = child.canvas as HTMLCanvasElement | undefined;
    if (!canvas) return child;
    const left = child.left ?? 0;
    const top = child.top ?? 0;
    // 既に全ドキュメント原点・サイズなら再配置不要（背景や自前生成の雛形レイヤー）
    if (left === 0 && top === 0 && canvas.width === docW && canvas.height === docH) return child;
    const full = document.createElement('canvas');
    full.width = docW;
    full.height = docH;
    const ctx = full.getContext('2d');
    if (ctx) ctx.drawImage(canvas, left, top);
    return { ...child, canvas: full, left: 0, top: 0, right: docW, bottom: docH };
  });
  return { ...psd, children };
};
