import { describe, expect, it } from 'vitest';
import { layerDrawRect } from '../geometry';

describe('layerDrawRect', () => {
  it('scale=1・pos=0: canvas(2400x1350) を frame(1920x1080) の中央に等倍配置（240/135 はみ出し）', () => {
    // 内側 div: width=2400/1=2400, height=1350/1=1350
    // right R = (2400 - 1920*(1-0))/2 = (2400-1920)/2 = 240 → dx = -240
    // bottom B = (1350 - 1080*(1-0))/2 = (1350-1080)/2 = 135 → dy = -135
    expect(layerDrawRect(2400, 1350, 1920, 1080, 1, 0, 0)).toEqual({ dx: -240, dy: -135, dw: 2400, dh: 1350 });
  });

  it('scale=2: 拡大（dw/dh は 1/scale で縮む＝寄り）', () => {
    // dw = 2400/2 = 1200, dh = 1350/2 = 675
    // R = (2400 - 1920*(2-0))/2 = (2400-3840)/2 = -720 → dx = 720
    // B = (1350 - 1080*(2-0))/2 = (1350-2160)/2 = -405 → dy = 405
    expect(layerDrawRect(2400, 1350, 1920, 1080, 2, 0, 0)).toEqual({ dx: 720, dy: 405, dw: 1200, dh: 675 });
  });

  it('posX/posY が描画位置をずらす', () => {
    // R = (2400 - 1920*(1-0.1))/2 = (2400-1728)/2 = 336 → dx = -336
    // B = (1350 - 1080*(1-0.2))/2 = (1350-864)/2 = 243 → dy = -243
    expect(layerDrawRect(2400, 1350, 1920, 1080, 1, 0.1, 0.2)).toEqual({ dx: -336, dy: -243, dw: 2400, dh: 1350 });
  });
});
