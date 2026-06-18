import { describe, it, expect } from 'vitest';
import { cutOffsets, totalFrames as totalFramesPure } from '../cutOffsets';
import { totalFrames as totalFramesVideo } from '../../video/exportVideo';

// A=48f（fadeOut Cross 12）/ B=36f（fadeIn Cross 12）→ 重なり 12・total 72
const cross = (): Cut[] => [
  { time: 48, action: { fadeOut: 'Cross', fadeOutDuration: 12 } },
  { time: 36, action: { fadeIn: 'Cross', fadeInDuration: 12 } },
];
const noCross = (): Cut[] => [{ time: 48 }, { time: 36 }];

describe('クロス時間モデルの5面一貫', () => {
  it('cutOffsets: A[0,48]・B[36,72]（重なり12を反映）', () => {
    expect(cutOffsets(cross())).toEqual([{ start: 0, end: 48 }, { start: 36, end: 72 }]);
  });

  it('総尺は 48+36−12 = 72', () => {
    expect(totalFramesPure(cross())).toBe(72);
  });

  it('exportVideo.totalFrames は cutOffsets 版と一致（再エクスポート＝動画とその他で尺がズレない）', () => {
    expect(totalFramesVideo(cross())).toBe(totalFramesPure(cross()));
    expect(totalFramesVideo(cross())).toBe(72);
  });

  it('各 span 長はカット自身の尺（HUD 右上−左上 = cut.time）', () => {
    const spans = cutOffsets(cross());
    expect(spans[0].end - spans[0].start).toBe(48);
    expect(spans[1].end - spans[1].start).toBe(36);
    // 前カットの右上(48) と 次カットの左上(36) は一致しない（差＝クロス尺12）
    expect(spans[0].end - spans[1].start).toBe(12);
  });

  it('クロス解除で完全可逆（B[48,84]・総尺84）', () => {
    expect(cutOffsets(noCross())).toEqual([{ start: 0, end: 48 }, { start: 48, end: 84 }]);
    expect(totalFramesPure(noCross())).toBe(84);
    expect(totalFramesVideo(noCross())).toBe(84);
  });
});
