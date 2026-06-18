import { describe, expect, it } from 'vitest';
import { Psd } from 'ag-psd';
import { buildProject, migrateV1, sortPsdNames, emptyProject, isValidProjectJson } from '../load';
import { ProjectFile } from '../types';

const psdMeta = [
  { name: 'c001.psd', width: 1920, height: 1080 },
  { name: 'c002.psd', width: 2730, height: 1536 },
];

const v1Cuts = [
  {
    action: { fadeIn: 'Black In' as const, fadeInDuration: 96 },
    dialogue: '佑希「楽しみだな！」',
    time: 168,
  },
  {
    cameraWork: {
      position: { in: { x: 0, y: 0 }, out: { x: -0.42, y: 0 } },
      scale: { in: 1.42, out: 1 },
    },
    dialogue: '佑希「僕と晴奈は…」',
    time: 156,
  },
];

describe('sortPsdNames', () => {
  it('数値を考慮してソートする', () => {
    expect(sortPsdNames(['c010.psd', 'c002.psd', 'c001.psd'])).toEqual(['c001.psd', 'c002.psd', 'c010.psd']);
  });
});

describe('migrateV1', () => {
  it('v1 の各カットを 1カット1行に変換し PSD を index 対応で割り当てる', () => {
    const project = migrateV1(v1Cuts, psdMeta, 'WithYou');
    expect(project.version).toBe(2);
    expect(project.title).toBe('WithYou');
    expect(project.settings.frame).toEqual({ width: 1920, height: 1080 });
    expect(project.settings.fps).toBe(24);
    expect(project.cuts).toHaveLength(2);

    const [cut1, cut2] = project.cuts;
    expect(cut1.psd).toBe('c001.psd');
    expect(cut1.time).toBe(168);
    expect(cut1.action?.fadeIn).toBe('Black In');
    expect(cut1.rows).toHaveLength(1);
    expect(cut1.rows[0].dialogue).toBe('佑希「楽しみだな！」');
    expect(cut1.rows[0].canvas).toEqual({ width: 1920, height: 1080 });

    expect(cut2.psd).toBe('c002.psd');
    expect(cut2.cameraWork?.scale?.in).toBe(1.42);
    expect(cut2.rows[0].canvas).toEqual({ width: 2730, height: 1536 });
  });

  it('PSD が足りないカットは既定キャンバスになる', () => {
    const project = migrateV1(v1Cuts, psdMeta.slice(0, 1));
    expect(project.cuts[1].psd).toBeUndefined();
    expect(project.cuts[1].rows[0].canvas).toEqual({ width: 2400, height: 1350 });
  });

  it('カット ID と行 ID は一意になる', () => {
    const project = migrateV1(v1Cuts, psdMeta);
    const ids = project.cuts.flatMap((c) => [c.id, ...c.rows.map((r) => r.id)]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('buildProject', () => {
  const fakePsd = (width: number, height: number): Psd => ({ width, height });
  const loadedPsds = [
    { name: 'c001.psd', psd: fakePsd(1920, 1080) },
    { name: 'c002.psd', psd: fakePsd(2730, 1536) },
  ];

  it('配列 JSON は v1 と判定して移行する', () => {
    const { project, cache } = buildProject(JSON.stringify(v1Cuts), loadedPsds, 'WithYou.json');
    expect(project.version).toBe(2);
    expect(project.title).toBe('WithYou');
    expect(project.cuts[0].psd).toBe('c001.psd');
    expect(cache['c002.psd'].width).toBe(2730);
  });

  it('v2 JSON はそのまま読み込む', () => {
    const v2 = emptyProject('MyConte');
    v2.cuts.push({
      id: 'cut-1',
      psd: 'c001.psd',
      time: 48,
      rows: [{ id: 'row-1', layer: '1', dialogue: 'テスト', canvas: { width: 2400, height: 1350 } }],
    });
    const { project } = buildProject(JSON.stringify(v2), loadedPsds, 'MyConte.json');
    expect(project.version).toBe(2);
    expect(project.cuts).toHaveLength(1);
    expect(project.cuts[0].rows[0].dialogue).toBe('テスト');
  });

  it('未知の version は例外を投げる', () => {
    expect(() => buildProject(JSON.stringify({ version: 99 }), [], 'x.json')).toThrow(/Unsupported/);
  });

  it('sceneStart の無い v2 JSON もそのまま読める（後方互換）', () => {
    const v2 = emptyProject('Legacy');
    v2.cuts.push({
      id: 'cut-1',
      psd: 'c001.psd',
      time: 48,
      rows: [{ id: 'row-1', layer: '1', dialogue: 'x', canvas: { width: 1920, height: 1080 } }],
    });
    const { project } = buildProject(JSON.stringify(v2), loadedPsds, 'Legacy.json');
    expect(project.cuts[0].sceneStart).toBeUndefined();
  });

  describe('壊れた/古い JSON の正規化（描画 throw 防止）', () => {
    const settings = { aspect: '16:9', resolution: 'FHD', frame: { width: 1920, height: 1080 }, fps: 24 };
    const validRow = { id: 'r', layer: '1', canvas: { width: 10, height: 10 } };

    it('settings 欠落 v2 を既定 settings で補完', () => {
      const { project } = buildProject(JSON.stringify({ version: 2, cuts: [] }), [], 'x.json');
      expect(project.settings.frame.width).toBeGreaterThan(0);
      expect(project.settings.frame.height).toBeGreaterThan(0);
      expect(project.settings.fps).toBeGreaterThan(0);
    });

    it('rows 欠落 cut に既定1行を補完（throw しない）', () => {
      const json = JSON.stringify({ version: 2, settings, cuts: [{ id: 'a', time: 24 }] });
      const { project } = buildProject(json, [], 'x.json');
      expect(Array.isArray(project.cuts[0].rows)).toBe(true);
      expect(project.cuts[0].rows.length).toBeGreaterThanOrEqual(1);
      expect(project.cuts[0].rows[0].canvas.width).toBeGreaterThan(0);
    });

    it('time が非数値/負/0/巨大なら既定/上限へ正規化', () => {
      const mk = (time: unknown): number =>
        buildProject(JSON.stringify({ version: 2, settings, cuts: [{ id: 'a', rows: [validRow], time }] }), [], 'x.json')
          .project.cuts[0].time as number;
      expect(mk('abc')).toBeGreaterThanOrEqual(1);
      expect(mk(-5)).toBeGreaterThanOrEqual(1);
      expect(mk(0)).toBeGreaterThanOrEqual(1); // 0コマ禁止
      expect(Number.isFinite(mk(9e20))).toBe(true);
      expect(mk(9e20)).toBeLessThanOrEqual(24 * 3600);
      expect(mk(48)).toBe(48); // 有効値は維持
    });

    it('time 未設定は据え置き（undefined のまま・クラッシュしない）', () => {
      const json = JSON.stringify({ version: 2, settings, cuts: [{ id: 'a', rows: [validRow] }] });
      const { project } = buildProject(json, [], 'x.json');
      expect(project.cuts[0].time).toBeUndefined();
    });

    it('cameraWork が部分欠損(position:{}) なら undefined に倒す', () => {
      const json = JSON.stringify({
        version: 2,
        settings,
        cuts: [{ id: 'a', rows: [validRow], cameraWork: { position: {} } }],
      });
      const { project } = buildProject(json, [], 'x.json');
      expect(project.cuts[0].cameraWork).toBeUndefined();
    });

    it('完全な cameraWork は維持', () => {
      const cw = { scale: { in: 1.4, out: 1 }, position: { in: { x: 0, y: 0 }, out: { x: -0.4, y: 0 } } };
      const json = JSON.stringify({ version: 2, settings, cuts: [{ id: 'a', rows: [validRow], cameraWork: cw }] });
      const { project } = buildProject(json, [], 'x.json');
      expect(project.cuts[0].cameraWork?.scale?.in).toBe(1.4);
    });
  });
});

describe('isValidProjectJson', () => {
  it('accepts a v2 project object (version 2 + cuts array)', () => {
    expect(isValidProjectJson(JSON.stringify(emptyProject('P')))).toBe(true);
    expect(isValidProjectJson('{"version":2,"cuts":[]}')).toBe(true);
  });

  it('accepts a v1 top-level array', () => {
    expect(isValidProjectJson('[]')).toBe(true);
    expect(isValidProjectJson(JSON.stringify(v1Cuts))).toBe(true);
  });

  it('rejects malformed / non-project JSON', () => {
    expect(isValidProjectJson('not json at all')).toBe(false); // パース失敗
    expect(isValidProjectJson('')).toBe(false); // 空文字
    expect(isValidProjectJson('null')).toBe(false); // null
    expect(isValidProjectJson('123')).toBe(false); // 数値
    expect(isValidProjectJson('{}')).toBe(false); // version/cuts なし
    expect(isValidProjectJson('{"version":2}')).toBe(false); // cuts なし
    expect(isValidProjectJson('{"version":1,"cuts":[]}')).toBe(false); // 未対応 version
    expect(isValidProjectJson('{"version":2,"cuts":"x"}')).toBe(false); // cuts が配列でない
  });
});
