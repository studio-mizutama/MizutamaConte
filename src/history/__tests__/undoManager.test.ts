import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectFile } from 'project/types';
import {
  record,
  popUndo,
  popRedo,
  clearHistory,
  canUndo,
  canRedo,
  __resetHistoryForTest,
} from 'history/undoManager';
import { Transaction } from 'history/types';

const proj = (title: string): ProjectFile => ({
  version: 2,
  title,
  settings: { aspect: '16:9', resolution: 'FHD', frame: { width: 1920, height: 1080 }, fps: 24 },
  cuts: [],
});

const tx = (label: string, prev: ProjectFile, next: ProjectFile, coalesceKey?: string): Transaction => ({
  label,
  coalesceKey,
  prevProject: prev,
  nextProject: next,
  prevSelectedCutIndex: 0,
  nextSelectedCutIndex: 0,
});

describe('undoManager', () => {
  beforeEach(() => __resetHistoryForTest());

  it('record で undo 可能になり redo は空のまま', () => {
    expect(canUndo()).toBe(false);
    record(tx('a', proj('p0'), proj('p1')));
    expect(canUndo()).toBe(true);
    expect(canRedo()).toBe(false);
  });

  it('popUndo は最新を返し redo へ積む', () => {
    record(tx('a', proj('p0'), proj('p1')));
    const t = popUndo();
    expect(t?.label).toBe('a');
    expect(canUndo()).toBe(false);
    expect(canRedo()).toBe(true);
  });

  it('popRedo は元に戻して undo へ積む', () => {
    record(tx('a', proj('p0'), proj('p1')));
    popUndo();
    const t = popRedo();
    expect(t?.label).toBe('a');
    expect(canUndo()).toBe(true);
    expect(canRedo()).toBe(false);
  });

  it('新規 record で redo スタックがクリアされる', () => {
    record(tx('a', proj('p0'), proj('p1')));
    popUndo();
    expect(canRedo()).toBe(true);
    record(tx('b', proj('p0'), proj('p2')));
    expect(canRedo()).toBe(false);
  });

  it('同一 coalesceKey の連続 record は 1 ステップへ合流（prev は開始時を保持）', () => {
    record(tx('dialogue', proj('p0'), proj('p1'), 'dialogue:0'));
    record(tx('dialogue', proj('p1'), proj('p2'), 'dialogue:0'));
    const t = popUndo();
    expect(t?.prevProject.title).toBe('p0'); // 開始時
    expect(t?.nextProject.title).toBe('p2'); // 後端
    expect(canUndo()).toBe(false); // 1 ステップに合流している
  });

  it('coalesceKey が異なれば別ステップ', () => {
    record(tx('dialogue', proj('p0'), proj('p1'), 'dialogue:0'));
    record(tx('dialogue', proj('p1'), proj('p2'), 'dialogue:1'));
    expect(popUndo()?.nextProject.title).toBe('p2');
    expect(popUndo()?.nextProject.title).toBe('p1');
  });

  it('clearHistory で両スタックが空になる', () => {
    record(tx('a', proj('p0'), proj('p1')));
    popUndo();
    clearHistory();
    expect(canUndo()).toBe(false);
    expect(canRedo()).toBe(false);
  });
});
