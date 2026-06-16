import React, { useCallback, useEffect, useState } from 'react';
import { useGlobal } from 'reactn';
import { Flex, Button, Text } from '@adobe/react-spectrum';
import styled from 'styled-components';
import { useHotkeys } from 'react-hotkeys-hook';
import { useStopwatch } from 'hooks/useStopwatch';
import { useEditorMode } from 'hooks/editorMode';
import { useProject } from 'hooks/useProject';
import { useProjectActions } from 'hooks/useProjectActions';
import { msToFrames, frameToTimecode } from 'project/time';
import { useT } from 'i18n';

const Display = styled.div`
  font-family: var(--spectrum-alias-font-family-default, monospace);
  font-variant-numeric: tabular-nums;
  font-size: 36px;
  font-weight: 700;
  line-height: 1.1;
  text-align: center;
  user-select: none;
`;

const Sub = styled.div`
  text-align: center;
  color: var(--spectrum-global-color-gray-700);
  font-variant-numeric: tabular-nums;
`;

const RecDot = styled.span<{ $on: boolean }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  background: ${(p) => (p.$on ? '#e34850' : 'var(--spectrum-global-color-gray-500)')};
  ${(p) => (p.$on ? 'animation: sw-blink 1s steps(2, start) infinite;' : '')}
  @keyframes sw-blink {
    50% {
      opacity: 0.25;
    }
  }
`;

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** 経過ミリ秒 → MM:SS.CC（センチ秒）。朗読中にチラ見できる実時間表示。 */
const formatElapsed = (ms: number): string => {
  const totalCs = Math.floor(Math.max(0, ms) / 10);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  return `${pad2(Math.floor(totalSec / 60))}:${pad2(totalSec % 60)}.${pad2(cs)}`;
};

export const StopwatchPanel: React.FC = () => {
  const t = useT();
  const { project, fps } = useProject();
  const { setTime } = useProjectActions();
  const { isCounting, elapsedMs, start, stop, reset } = useStopwatch();
  const [selectedCutIndex, setSelectedCutIndex] = useGlobal('selectedCutIndex');
  const tab = useGlobal('mode')[0];
  const [editorMode] = useEditorMode();
  const [message, setMessage] = useState<string>('');

  const cuts = project.cuts;
  const liveFrames = msToFrames(elapsedMs, fps);

  const toggle = useCallback(() => {
    if (!cuts.length) return;
    if (isCounting) {
      const ms = stop();
      const frames = msToFrames(ms, fps);
      if (frames >= 1) {
        setTime(selectedCutIndex, frames);
        if (selectedCutIndex < cuts.length - 1) {
          setSelectedCutIndex(selectedCutIndex + 1);
          setMessage('');
        } else {
          setMessage(t('stopwatch.lastCut'));
        }
      } else {
        setMessage(t('stopwatch.tooShort'));
      }
      reset();
    } else {
      setMessage('');
      start();
    }
  }, [cuts.length, cuts, isCounting, stop, fps, setTime, selectedCutIndex, setSelectedCutIndex, reset, start, t]);

  // タブ離脱（Edit→Preview など）では display:none で unmount されないため、明示的に計測キャンセル。
  useEffect(() => {
    if (tab !== 'Edit' || editorMode !== 'stopwatch') reset();
  }, [tab, editorMode, reset]);

  useHotkeys(
    'space',
    (e) => {
      if (tab !== 'Edit' || editorMode !== 'stopwatch') return;
      e.preventDefault();
      toggle();
    },
    [tab, editorMode, toggle],
  );

  useHotkeys(
    'esc',
    () => {
      if (isCounting) {
        reset();
        setMessage('');
      }
    },
    [isCounting, reset],
  );

  const hasCut = cuts.length > 0;

  return (
    <Flex direction="column" gap="size-150" marginTop="size-100">
      <Display>
        <RecDot $on={isCounting} />
        {formatElapsed(elapsedMs)}
      </Display>
      <Sub>{`${liveFrames}f · ${frameToTimecode(liveFrames, fps)}`}</Sub>
      <Button
        variant={isCounting ? 'negative' : 'cta'}
        onPress={toggle}
        isDisabled={!hasCut}
        width="100%"
      >
        {isCounting ? t('stopwatch.stop') : t('stopwatch.start')}
      </Button>
      <Sub>
        <Text>{!hasCut ? t('stopwatch.hintSelect') : message || t('stopwatch.hintIdle')}</Text>
      </Sub>
    </Flex>
  );
};
