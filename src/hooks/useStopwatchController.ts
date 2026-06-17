import { useCallback, useEffect, useRef } from 'react';
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
  /** 選択カット（idle 時のアクティブ Rec 表示用 = selectedCutIndex） */
  activeIndex: number;
  /** 計測中のカット index（計測中以外は null）。start 時に確定し計測中は固定。 */
  countingIndex: number | null;
  /** 計測中の経過フレーム（計測中以外は 0） */
  liveFrames: number;
  /** index のカットを対象に開始/停止トグル（停止時に setTime コミット・auto-advance なし） */
  toggle: (index?: number) => void;
}

/** インライン Rec の計測状態を 1 箇所に集約。Conte から 1 回だけ呼ぶ。 */
export const useStopwatchController = (): StopwatchController => {
  const { project, fps } = useProject();
  const { setTime } = useProjectActions();
  const { isCounting, elapsedMs, start, stop, reset } = useStopwatch();
  const [selectedCutIndex, setSelectedCutIndex] = useGlobal('selectedCutIndex');
  const tab = useGlobal('mode')[0];
  const [editorMode] = useEditorMode();
  const stopwatchMode = editorMode === 'stopwatch';

  // toggle を毎フレーム作り直さないため、可変値は ref に逃がす（per-frame 変化は elapsedMs のみ）
  const setTimeRef = useRef(setTime);
  setTimeRef.current = setTime;
  const fpsRef = useRef(fps);
  fpsRef.current = fps;
  const selectedRef = useRef(selectedCutIndex);
  selectedRef.current = selectedCutIndex;
  const cutsLenRef = useRef(project.cuts.length);
  cutsLenRef.current = project.cuts.length;
  // 計測対象は start 時に確定（計測中に別行を選んでも誤コミットしない）
  const startedIndexRef = useRef(0);

  const toggle = useCallback(
    (index?: number) => {
      if (cutsLenRef.current === 0) return;
      if (isCounting) {
        const ms = stop();
        const frames = msToFrames(ms, fpsRef.current);
        if (frames >= 1) setTimeRef.current(startedIndexRef.current, frames);
        reset();
      } else {
        const target = index ?? selectedRef.current;
        if (index !== undefined && index !== selectedRef.current) setSelectedCutIndex(index);
        startedIndexRef.current = target;
        start();
      }
    },
    [isCounting, stop, reset, start, setSelectedCutIndex],
  );

  // stopwatch モード/Edit タブを離れたら計測キャンセル（display:none で unmount されないため明示）
  useEffect(() => {
    if (!stopwatchMode || tab !== 'Edit') reset();
  }, [stopwatchMode, tab, reset]);

  useHotkeys(
    'space',
    (e) => {
      if (tab !== 'Edit' || !stopwatchMode) return;
      e.preventDefault();
      toggle();
    },
    [tab, stopwatchMode, toggle],
  );

  useHotkeys('esc', () => { if (isCounting) reset(); }, [isCounting, reset]);

  return {
    stopwatchMode,
    activeIndex: selectedCutIndex,
    countingIndex: isCounting ? startedIndexRef.current : null,
    liveFrames: isCounting ? msToFrames(elapsedMs, fpsRef.current) : 0,
    toggle,
  };
};
