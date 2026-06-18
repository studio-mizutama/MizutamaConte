import { Transaction } from 'history/types';

// モジュール singleton（save.ts の lastPersisted と同流儀）。reactn には依存しない
let undoStack: Transaction[] = [];
let redoStack: Transaction[] = [];
// canUndo/canRedo をグローバルへ反映するためのリスナ（useUndoRedo が登録）
let onChange: (() => void) | null = null;

export const setHistoryListener = (fn: (() => void) | null): void => {
  onChange = fn;
};

export const canUndo = (): boolean => undoStack.length > 0;
export const canRedo = (): boolean => redoStack.length > 0;

/** 新しい編集を記録。同一 coalesceKey が直前にあれば合流。redo は必ずクリア */
export const record = (txn: Transaction): void => {
  redoStack = [];
  const top = undoStack[undoStack.length - 1];
  if (txn.coalesceKey && top && top.coalesceKey === txn.coalesceKey) {
    undoStack[undoStack.length - 1] = {
      ...top,
      nextProject: txn.nextProject,
      nextSelectedCutIndex: txn.nextSelectedCutIndex,
    };
  } else {
    undoStack.push(txn);
  }
  onChange?.();
};

/** undo 対象を取り出し redo へ積む（実際の適用は呼び出し側） */
export const popUndo = (): Transaction | null => {
  const txn = undoStack.pop();
  if (!txn) return null;
  redoStack.push(txn);
  onChange?.();
  return txn;
};

/** redo 対象を取り出し undo へ戻す */
export const popRedo = (): Transaction | null => {
  const txn = redoStack.pop();
  if (!txn) return null;
  undoStack.push(txn);
  onChange?.();
  return txn;
};

export const clearHistory = (): void => {
  undoStack = [];
  redoStack = [];
  onChange?.();
};

/** テスト用リセット */
export const __resetHistoryForTest = (): void => {
  undoStack = [];
  redoStack = [];
  onChange = null;
};
