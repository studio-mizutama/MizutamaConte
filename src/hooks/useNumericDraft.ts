import { useState } from 'react';

/** 入力文字列を parse し、null（不正）なら採用しない＝呼び出し側で直前値へ復帰させる純関数（テスト容易化のため分離）。 */
export const resolveNumericCommit = (text: string, parse: (s: string) => number | null): number | null => parse(text);

export interface NumericDraft {
  /** 下書き中はその文字列、未編集なら value を format した文字列 */
  displayValue: string;
  /** input の onChange に渡す（下書き更新） */
  onChange: (text: string) => void;
  /** blur/Enter で確定。parse→null（不正）なら onCommit を呼ばず下書き破棄＝表示が直前値へ復帰 */
  commit: () => void;
  /** Escape 等で下書きを破棄（直前値へ復帰） */
  cancel: () => void;
}

/** 数値入力の「下書き文字列＋直前の正常値フォールバック」共通フック。
 *  不正入力を NaN/0 で確定せず、必ず直前の正常値（value）へ戻すための単一機構。 */
export const useNumericDraft = (opts: {
  value: number;
  format: (v: number) => string;
  parse: (s: string) => number | null;
  onCommit: (v: number) => void;
}): NumericDraft => {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = (): void => {
    if (draft !== null) {
      const v = resolveNumericCommit(draft, opts.parse);
      if (v !== null) opts.onCommit(v);
    }
    setDraft(null);
  };
  return {
    displayValue: draft ?? opts.format(opts.value),
    onChange: setDraft,
    commit,
    cancel: () => setDraft(null),
  };
};
