import React, { useState, useEffect, useRef, useGlobal } from 'reactn';
import { Heading, Flex, ProgressCircle } from '@adobe/react-spectrum';
import styled from 'styled-components';
import { usePsd } from 'hooks/usePsd';
import { useProject } from 'hooks/useProject';
import { useViewportSize } from 'hooks/useViewportSize';
import { thumbnailScale } from 'project/dimensions';
import { frameToTimecode } from 'project/time';
import { frameUnitToDataURL } from 'psd/thumbnail';
import { useT } from 'i18n';
import { totalFrames, cutOffsets } from 'project/cutOffsets';
import { clampTimelineEnd } from 'project/limits';


const CutNumber = styled.div`
  position: absolute;
  color: #2c2c2c;
  z-index: 2;
`;

const ToolArea = styled.div`
  background-color: var(--spectrum-alias-toolbar-background-color);
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;
`;

const TimelineArea = styled.div`
  display: flex;
  flex-direction: row;
`;

const CutArea = styled(TimelineArea)`
  position: absolute;
`;

const Scale = styled.div`
  height: 8px;
  position: absolute;
  border-left: 1px solid var(--spectrum-alias-text-color);
`;

const ScaleNumber = styled.div`
  height: 16px;
  position: absolute;
  top: 16px;
`;

const TimelineContainer: React.FC<{ scale: number }> = React.memo(({ scale }) => {
  const t = useT();
  const cuts = usePsd();
  const isLoading = useGlobal('isLoading')[0];
  const { frame, fps } = useProject();
  const thumbScale = thumbnailScale(frame);

  const viewport = useViewportSize();
  const width = viewport.width - 340;

  const timeTotal = totalFrames(cuts ?? []);
  const cutSpans = cutOffsets(cuts ?? []);
  // end は totalFrames 由来。壊れた JSON 等で非有限/巨大になっても new Array で RangeError/フリーズしないよう安全化
  const range = (start: number, end: number) => {
    const safeEnd = Math.max(start, clampTimelineEnd(end));
    return [...new Array(safeEnd - start).keys()].map((n) => n + start);
  };

  return (
    <>
      <TimelineArea style={{ width: `${width}px` }}>
        {range(0, timeTotal)
          .filter((n) => n % ((fps * 10) / scale) === 0)
          .map((n) => (
            <ScaleNumber key={n} style={{ left: `${n * scale + 2}px` }}>
              {frameToTimecode(n, fps)}
            </ScaleNumber>
          ))}
      </TimelineArea>
      <TimelineArea style={{ width: `${width}px` }}>
        {range(0, timeTotal)
          .filter((n) => n % ((fps / scale) | 0) === 0)
          .map((n) => (
            <Scale key={n} style={{ left: `${n * scale}px`, top: '32px', width: '24px' }} />
          ))}
        {range(0, timeTotal)
          .filter((n) => n % ((fps * 10) / scale) === 0)
          .map((n) => (
            <Scale key={n} style={{ left: `${n * scale}px`, top: '24px', width: '24px' }} />
          ))}
      </TimelineArea>
      <TimelineArea style={{ width: `${width}px` }}>
        {isLoading && (
          <Flex direction="column" alignItems="center" justifyContent="center" height="100%">
            <ProgressCircle aria-label={t('common.loading.ariaLabel')} isIndeterminate size="L" />
            <Heading>{t('common.loading.heading')}</Heading>
          </Flex>
        )}

        {cuts.length > 0 &&
          cuts.map((cut, index) => {
            const preTimeSum = cutSpans[index]?.start ?? 0;
            const time = cut?.time || 0;
            return (
              <CutArea
                style={{ left: `${preTimeSum * scale}px`, top: '40px', width: `${time * scale}px`, overflow: 'hidden' }}
                key={index}
              >
                {(() => {
                  // 各カット = 先頭ユニット（時系列の最前フレーム）を実背景込みで1枚だけ合成する。
                  // 共有コンポジタ（Editor/Preview/動画/印刷と同一経路）経由でグループ/ブレンド/背景を
                  // 正しく解釈し、複数ユニットでも先頭のみ描く（旧来「最前レイヤーのみ」挙動の踏襲）。
                  const thumbSrc = frameUnitToDataURL(cut.picture, 0);
                  if (!thumbSrc) return null;
                  const docW = (cut.picture?.width || 0) * thumbScale;
                  const docH = (cut.picture?.height || 0) * thumbScale;
                  return (
                    <div style={{ height: `${docH}px`, width: `${docW}px`, position: 'relative' }}>
                      <img
                        style={{ transform: `scale(${thumbScale})`, transformOrigin: 'left top' }}
                        src={thumbSrc}
                        alt="cut"
                      />
                    </div>
                  );
                })()}
                <CutNumber>
                  <Heading level={4} margin="size-25">
                    {`Cut${('00' + (index + 1)).slice(-3)}`}
                  </Heading>
                </CutNumber>
              </CutArea>
            );
          })}
      </TimelineArea>
    </>
  );
});

const Slide = styled.input`
  position: absolute;
  z-index: 3;
  -webkit-appearance: none;
  appearance: none;
  outline: none;
  border: none;
  margin: 0;
  padding: 0;
  height: 16px;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    top: 0;
    background: var(--spectrum-semantic-negative-color-border);
    width: 2px;
    height: 574px;
  }
`;

export const Timeline: React.FC<{
  frame: number;
  timeTotal: number;
  setFrame: React.Dispatch<React.SetStateAction<number>>;
}> = React.memo(({ frame, timeTotal, setFrame }) => {
  const setCurrentFrame = () => {
    const slide: HTMLInputElement =
      (document.getElementById('slide') as HTMLInputElement) || document.createElement('input');
    setFrame(Number.parseInt(slide.value));
  };

  const scale = 2;

  const width = timeTotal * scale;

  const viewport = useViewportSize();

  const toolAreaRef = useRef<HTMLDivElement>(null);

  const toolArea = toolAreaRef.current ?? document.createElement('div');

  const [scroll, setScroll] = useState(toolArea.scrollLeft);

  toolArea.addEventListener('scroll', () => {
    setScroll(toolArea.scrollLeft);
  });

  useEffect(() => {
    const currentPos = frame * scale - scroll;
    if (viewport.width - 364 < currentPos) {
      toolArea.scrollBy(viewport.width - 364, 0);
    }
    if (currentPos < 0) {
      toolArea.scrollBy(currentPos, 0);
    }
  }, [frame, scroll, toolArea, width, viewport.width]);

  return (
    <ToolArea ref={toolAreaRef}>
      <TimelineContainer scale={scale} />
      <Slide
        type="range"
        id="slide"
        value={frame}
        min="0"
        max={timeTotal}
        onChange={setCurrentFrame}
        // ドラッグ/クリック後はフォーカスを残さない（input にフォーカスが残ると
        // react-hotkeys-hook がフォーム要素内とみなし Space/矢印等のショートカットを発火させないため）。
        // マウス操作時のみ＝キーボードでの focus には不介入。
        onPointerUp={(e) => e.currentTarget.blur()}
        style={{ width: `${width}px` }}
      />
    </ToolArea>
  );
});
