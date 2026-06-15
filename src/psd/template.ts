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

/**
 * PSD ドキュメントを新しい寸法へリサイズする。
 * - children[0]=背景は新寸で白塗り直し
 * - children[1..]=描画レイヤーは既存内容を左上(0,0)アンカーで再配置（拡大=右下に白紙余白 / 縮小=右下端をクロップ）
 */
export const resizeDocPsd = (psd: Psd, width: number, height: number): { psd: Psd; buffer: Uint8Array } => {
  const anchored = (src?: HTMLCanvasElement) => {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    if (ctx && src) {
      ctx.drawImage(src, 0, 0);
    }
    return c;
  };

  const children = (psd.children ?? []).map((child, i) => {
    if (i === 0) {
      const bg = document.createElement('canvas');
      bg.width = width;
      bg.height = height;
      const ctx = bg.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }
      return { ...child, canvas: bg };
    }
    return { ...child, canvas: anchored(child.canvas as HTMLCanvasElement | undefined) };
  });

  const background = children[0]?.canvas ?? anchored(undefined);
  const next: Psd = { ...psd, width, height, children, canvas: background };
  const buffer = new Uint8Array(writePsd(next, { generateThumbnail: true }));
  return { psd: next, buffer };
};

/**
 * PSD が「白紙（未描画）」かを判定する。
 * children[0]=背景は除外し、描画レイヤー children[1..] が**すべて中身なし**なら true。
 * 各レイヤーの canvas を getImageData して alpha>0 のピクセルが 1 つも無ければ空とみなす。
 * canvas を持たないレイヤーや、描画レイヤーが 0 個のときも空（true）扱い。
 * ※ DOM/canvas 依存のため単体テストは非現実的。typecheck + 手動 smoke で担保する。
 */
export const isBlankPsd = (psd: Psd): boolean => {
  const drawnLayers = (psd.children ?? []).slice(1);
  return drawnLayers.every((layer) => {
    const canvas = layer.canvas;
    if (!canvas) return true; // canvas 不在 = 空扱い
    const ctx = canvas.getContext('2d');
    if (!ctx) return true; // 取得できなければ保守的に空扱い
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // RGBA の alpha チャンネル（4 バイトごとの 4 番目）に 1 つでも非ゼロがあれば描画あり
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) return false;
    }
    return true;
  });
};

const whiteCanvas = (width: number, height: number): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  return c;
};

/** 2つの PSD を統合する。base の末尾に add の描画レイヤー(children[1..])を連結する */
export const mergePsd = (base: Psd, add: Psd): { psd: Psd; buffer: Uint8Array } => {
  const addLayers = (add.children ?? []).slice(1);
  const next: Psd = { ...base, children: [...(base.children ?? []), ...addLayers] };
  const buffer = new Uint8Array(writePsd(next, { generateThumbnail: true }));
  return { psd: next, buffer };
};

/**
 * PSD の最終描画レイヤーを切り離す。
 * base = そのレイヤーを除いた PSD / layer = 白背景 + そのレイヤー1枚の新規 PSD。
 */
export const splitTopLayerPsd = (
  psd: Psd,
): { base: { psd: Psd; buffer: Uint8Array }; layer: { psd: Psd; buffer: Uint8Array } } => {
  const children = psd.children ?? [];
  const top = children[children.length - 1];
  const baseChildren = children.slice(0, -1);
  const basePsd: Psd = { ...psd, children: baseChildren, canvas: baseChildren[0]?.canvas ?? psd.canvas };
  const baseBuffer = new Uint8Array(writePsd(basePsd, { generateThumbnail: true }));

  const bg = whiteCanvas(psd.width, psd.height);
  const layerPsd: Psd = {
    width: psd.width,
    height: psd.height,
    children: [{ name: 'background', canvas: bg }, { name: '1', canvas: top?.canvas }],
    canvas: bg,
  };
  const layerBuffer = new Uint8Array(writePsd(layerPsd, { generateThumbnail: true }));

  return { base: { psd: basePsd, buffer: baseBuffer }, layer: { psd: layerPsd, buffer: layerBuffer } };
};
