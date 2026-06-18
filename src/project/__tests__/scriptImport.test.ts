import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseScript } from '../scriptImport';

const sample = readFileSync(join(__dirname, 'fixtures/script-sample.md'), 'utf8');

describe('parseScript', () => {
  it('先頭 h1 を作品名にする', () => {
    const r = parseScript(sample, 'fallback');
    expect(r.title).toBe('脚本mdインポート機能');
  });

  it('空カットを生成しない（全カットに dialogue か action のいずれかがある）', () => {
    const r = parseScript(sample, 'fallback');
    expect(r.cuts.length).toBeGreaterThan(0);
    for (const c of r.cuts) {
      expect(c.dialogue !== '' || c.action !== '').toBe(true);
    }
  });

  it('シーンタイトルを見出しから拾う（出現順）', () => {
    const r = parseScript(sample, 'fallback');
    const titles = r.cuts.filter((c) => c.sceneTitle !== undefined).map((c) => c.sceneTitle);
    expect(titles).toEqual(['シーンタイトル', '次のシーン', '次のシーン', 'もし途中にh1が来たら']);
  });

  it('コロン形/カギ括弧形を DIALOGUE として原文ママ保持する', () => {
    const r = parseScript(sample, 'fallback');
    const first = r.cuts[0];
    expect(first.dialogue).toContain('むい: このように');
    expect(first.dialogue).toContain('モンガー:コロンの後に');
    expect(first.dialogue).toContain('むい：このように'); // 全角コロン
    expect(first.dialogue).toContain('モンガー「このように'); // カギ括弧
  });

  it('md 記法を剥がして中身を ACTION に入れる（箇条書き・強調）', () => {
    const r = parseScript(sample, 'fallback');
    const joined = r.cuts.map((c) => c.action).join('\n');
    expect(joined).toContain('あああ'); // "- あああ" → "あああ"
    expect(joined).not.toContain('**'); // 強調記号は除去
    expect(joined).toContain('太字や斜体'); // "**太字**や*斜体*" → 中身
  });

  it('h1 直下の本文（次見出しまで）は無視する', () => {
    const r = parseScript(sample, 'fallback');
    const all = r.cuts.map((c) => `${c.dialogue}\n${c.action}`).join('\n');
    expect(all).not.toContain('インポートのやり方'); // h1 直下の本文
  });

  it('先頭が h2 ならファイル名をタイトルにしシーン1にする', () => {
    const r = parseScript('## 冒頭\nむい: やあ\n', 'myscript');
    expect(r.title).toBe('myscript');
    expect(r.cuts[0].sceneTitle).toBe('冒頭');
    expect(r.cuts[0].dialogue).toBe('むい: やあ');
  });

  it('見出しゼロ・空・区切りのみは cuts 0 件', () => {
    expect(parseScript('', 'x').cuts).toEqual([]);
    expect(parseScript('   \n  \n', 'x').cuts).toEqual([]);
    expect(parseScript('ただの本文\nもう一行\n', 'x').cuts).toEqual([]);
    expect(parseScript('## a\n---\n---\n', 'x').cuts).toEqual([]);
  });
});
