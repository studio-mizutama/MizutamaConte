import { useCallback, useEffect, useRef, useState } from 'react';
import { useGlobal } from 'reactn';
import { useHotkeys } from 'react-hotkeys-hook';
import { useStopwatch } from 'hooks/useStopwatch';
import { useEditorMode } from 'hooks/editorMode';
import { useProject } from 'hooks/useProject';
import { useProjectActions } from 'hooks/useProjectActions';
import { msToFrames } from 'project/time';

export interface StopwatchController {
  /** stopwatch モードか */
  stopwatchMode: boolean;
  /**
   * アクティブ（計測対象）カット index。未選択は null。
   * ツールを選んだ直後はどの行もアクティブにしない（= null）。クリックで初めて確定する。
   * グローバルの selectedCutIndex（編集の選択）とは独立させる（編集選択の引き継ぎで
   * 起動直後に Rec が出てしまう問題を防ぐ）。
   */
  activeIndex: number | null;
  /** 計測中のカット index（計測中以外は null）。start 時に確定し計測中は固定。 */
  countingIndex: number | null;
  /** 計測中の経過フレーム（計測中以外は 0） */
  liveFrames: number;
  /** カットをアクティブ化（= 計測対象に。計測中は無視） */
  activate: (index: number) => void;
  /** 開始/停止トグル（停止時に setTime コミット）。index=null は no-op。 */
  toggle: (index: number | null) => void;
}

/** インライン Rec の計測状態を 1 箇所に集約。Conte から 1 回だけ呼ぶ。 */
export const useStopwatchController = (): StopwatchController => {
  const { project, fps } = useProject();
  const { setTime } = useProjectActions();
  const { isCounting, elapsedMs, start, stop, reset } = useStopwatch();
  const tab = useGlobal('mode')[0];
  const [editorMode] = useEditorMode();
  const stopwatchMode = editorMode === 'stopwatch';
  // ストップウォッチ専用のアクティブカット（編集選択から独立・初期 null）
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // toggle を毎フレーム作り直さないため、可変値は ref に逃がす（per-frame 変化は elapsedMs のみ）
  const setTimeRef = useRef(setTime);
  setTimeRef.current = setTime;
  const fpsRef = useRef(fps);
  fpsRef.current = fps;
  const cutsLenRef = useRef(project.cuts.length);
  cutsLenRef.current = project.cuts.length;
  // 計測対象は start 時に確定（計測中にクリックしても誤コミットしない）
  const startedIndexRef = useRef(0);

  const activate = useCallback(
    (index: number) => {
      if (isCounting) return; // 計測中は対象を変えない
      setActiveIndex(index);
    },
    [isCounting],
  );

  const toggle = useCallback(
    (index: number | null) => {
      if (isCounting) {
        const ms = stop();
        const frames = msToFrames(ms, fpsRef.current);
        if (frames >= 1) setTimeRef.current(startedIndexRef.current, frames);
        reset();
        return;
      }
      if (index === null || cutsLenRef.current === 0) return;
      startedIndexRef.current = index;
      setActiveIndex(index);
      start();
    },
    [isCounting, stop, reset, start],
  );

  // ツール出入りで active と計測をリセット（起動直後・再選択時はどの行もアクティブにしない）
  useEffect(() => {
    setActiveIndex(null);
    reset();
  }, [stopwatchMode, reset]);
  // Edit タブを離れたら計測キャンセル（display:none で unmount されないため明示）
  useEffect(() => {
    if (tab !== 'Edit') reset();
  }, [tab, reset]);

  useHotkeys(
    'space',
    (e) => {
      if (tab !== 'Edit' || !stopwatchMode) return;
      e.preventDefault();
      toggle(activeIndex);
    },
    [tab, stopwatchMode, toggle, activeIndex],
  );
  useHotkeys('esc', () => { if (isCounting) reset(); }, [isCounting, reset]);

  return {
    stopwatchMode,
    activeIndex,
    countingIndex: isCounting ? startedIndexRef.current : null,
    liveFrames: isCounting ? msToFrames(elapsedMs, fpsRef.current) : 0,
    activate,
    toggle,
  };
};
