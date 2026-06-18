import { describe, it, expect } from 'vitest';
import { buildProject } from '../load';
import { cutCanvas } from '../scene';
import { deriveDisplayCut, reconcileDisplayCuts } from '../displayCut';
import { cutOffsets, totalFrames } from '../cutOffsets';
import { frameStates } from '../frameState';
import { clampTimelineEnd, MAX_TIMELINE_FRAMES } from '../limits';
import { cameraFrames } from '../../print/cameraFrame';
import { parseTimecode } from '../time';
import { isValidCutFrames } from '../limits';

/**
 * 「壊れた/古い JSON を開いても描画経路が throw しない」ことのエンドツーエンド回帰テスト。
 * 監査が特定した throw 地点（deriveDisplayCut の rows.map / cutCanvas の rows[0] / cameraFrames /
 * cutOffsets→Timeline range）を、生の壊れ JSON → buildProject 正規化 → 全描画純関数の順で一気に叩く。
 */
const settings = { aspect: '16:9', resolution: 'FHD', frame: { width: 1920, height: 1080 }, fps: 24 };
const validRow = { id: 'r', layer: '1', canvas: { width: 10, height: 10 } };

const brokenCases: Record<string, string> = {
  'settings 欠落': JSON.stringify({ version: 2, cuts: [{ id: 'a', rows: [validRow], time: 48 }] }),
  'rows 欠落': JSON.stringify({ version: 2, settings, cuts: [{ id: 'a', time: 48 }] }),
  'rows 非配列': JSON.stringify({ version: 2, settings, cuts: [{ id: 'a', rows: 'x', time: 48 }] }),
  'cameraWork 部分欠損': JSON.stringify({ version: 2, settings, cuts: [{ id: 'a', rows: [validRow], cameraWork: { position: {} } }] }),
  'time 非数値': JSON.stringify({ version: 2, settings, cuts: [{ id: 'a', rows: [validRow], time: 'abc' }] }),
  'time 巨大': JSON.stringify({ version: 2, settings, cuts: [{ id: 'a', rows: [validRow], time: 9e20 }] }),
  'time 負': JSON.stringify({ version: 2, settings, cuts: [{ id: 'a', rows: [validRow], time: -5 }] }),
  '空 cuts': JSON.stringify({ version: 2, settings, cuts: [] }),
};

describe('crash hardening: 壊れた JSON でも描画経路が throw しない', () => {
  for (const [label, json] of Object.entries(brokenCases)) {
    it(`${label}: buildProject→全描画純関数が throw しない`, () => {
      const { project } = buildProject(json, [], 'broken.json');
      const projectCuts = project.cuts;
      const display = projectCuts.map((c) => deriveDisplayCut(c, undefined));

      expect(() => {
        projectCuts.forEach((c) => cutCanvas(c));
        reconcileDisplayCuts(projectCuts, {}, new Map());
        display.forEach((d) =>
          cameraFrames({ frameW: 100, frameH: 100, displayW: 120, displayH: 120, cameraWork: d.cameraWork }),
        );
        cutOffsets(display);
        frameStates(0, display);
        const total = totalFrames(display);
        const safe = clampTimelineEnd(total);
        // Timeline range が生成する配列長が安全範囲（RangeError/フリーズしない）
        expect(safe).toBeGreaterThanOrEqual(0);
        expect(safe).toBeLessThanOrEqual(MAX_TIMELINE_FRAMES);
        // eslint-disable-next-line no-new
        new Array(safe); // RangeError: Invalid array length が出ないこと
      }).not.toThrow();
    });
  }
});

describe('crash hardening: 数値入力は不正・0コマ・巨大を確定しない', () => {
  it('0 コマは確定対象にならない（0コマカット禁止）', () => {
    const frames = parseTimecode('0', 24);
    expect(frames).toBe(0);
    expect(frames !== null && isValidCutFrames(frames, 24)).toBe(false);
  });
  it('巨大値は確定対象にならない（Timeline クラッシュ源を遮断）', () => {
    const frames = parseTimecode('9999999999', 24);
    expect(frames).not.toBeNull();
    expect(frames !== null && isValidCutFrames(frames, 24)).toBe(false);
  });
  it('正常値は確定できる', () => {
    const frames = parseTimecode('48', 24);
    expect(frames !== null && isValidCutFrames(frames, 24)).toBe(true);
  });
});
