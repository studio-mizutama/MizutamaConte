import { writePsd, Psd } from 'ag-psd';

/**
 * 新規カット用の PSD 雛形を生成する。
 * children[0] = 白背景、children[1..] = 描画レイヤー（透明）という
 * 既存の読み込み規約（背景を除外して順序でマップ）に合わせる。
 * composite（統合画像）も付与して CLIP STUDIO PAINT / Photoshop 互換性を確保する。
 */
export const createTemplatePsd = (
  width: number,
  height: number,
  layerNames: string[] = ['1'],
): { psd: Psd; buffer: Uint8Array } => {
  const background = document.createElement('canvas');
  background.width = width;
  background.height = height;
  const ctx = background.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  const layers = layerNames.map((name) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return { name, canvas };
  });

  const psd: Psd = {
    width,
    height,
    children: [{ name: 'background', canvas: background }, ...layers],
    canvas: background,
  };
  // writePsdBuffer は Node 専用 (Buffer) のため、ブラウザでも動く writePsd を使う
  const buffer = new Uint8Array(writePsd(psd, { generateThumbnail: true }));
  return { psd, buffer };
};

/**
 * 既存 PSD の末尾に透明レイヤーを 1 枚追加して書き出す。
 * children[0]=背景 / children[1..]=描画レイヤー の規約を保つ（末尾 push）。
 */
export const appendLayerToPsd = (psd: Psd, name: string): { psd: Psd; buffer: Uint8Array } => {
  const width = psd.width;
  const height = psd.height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const next: Psd = { ...psd, children: [...(psd.children ?? []), { name, canvas }] };
  // writePsdBuffer は Node 専用 (Buffer)。ブラウザでも動く writePsd を使う
  const buffer = new Uint8Array(writePsd(next, { generateThumbnail: true }));
  return { psd: next, buffer };
};
