import React, { useState, useEffect, useCallback, useRef } from 'reactn';
import { ActionButton, Heading, Flex, ProgressCircle } from '@adobe/react-spectrum';
import styled from 'styled-components';
import Rewind from '@spectrum-icons/workflow/Rewind';
import StepBackward from '@spectrum-icons/workflow/StepBackward';
import Play from '@spectrum-icons/workflow/Play';
import Pause from '@spectrum-icons/workflow/Pause';
import StepForward from '@spectrum-icons/workflow/StepForward';
import FastForward from '@spectrum-icons/workflow/FastForward';
import { Timeline } from 'Timeline';
import { usePsd } from 'hooks/usePsd';
import { useProject } from 'hooks/useProject';
import { useViewportSize } from 'hooks/useViewportSize';
import { defaultCanvasSize } from 'project/dimensions';
import { frameToTimecode } from 'project/time';
import { frameState } from 'project/frameState';
import { clampFrame } from 'project/frameNav';
import { compositeFrame } from 'video/compositor';
import { useGlobal } from 'reactn';
import { useT } from 'i18n';

const PreviewHeader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: max-content;
`;

const CountIn = styled.div`
  width: 48px;
  color: var(--spectrum-semantic-positive-color-border);
  margin-left: 0;
  margin-right: auto;
`;
const CountOut = styled.div`
  width: 48px;
  color: var(--spectrum-semantic-negative-color-border);
  margin-left: auto;
  margin-right: 0;
`;

interface Buffers {
  w: number;
  h: number;
  out: OffscreenCanvas;
  scratch: OffscreenCanvas;
  frameBuffer: OffscreenCanvas;
  unitScratch: OffscreenCanvas;
}

/** frame に対応するアクティブカット（index / 前後の累積尺）を求める純ヘルパ。 */
const activeCutInfo = (frame: number, cuts: Cut[], timeTotal: number) => {
  let pre = 0;
  for (let i = 0; i < cuts.length; i++) {
    const time = cuts[i].time || 0;
    if (frame < pre + time) {
      const prePre = i >= 1 ? cuts.slice(0, i - 1).reduce((s, c) => s + (c.time || 0), 0) : 0;
      return { index: i, preTimeSum: pre, timeSum: pre + time, prePreTimeSum: prePre };
    }
    pre += time;
  }
  // 範囲外（総尺以上）は末尾カットへクランプ
  const last = Math.max(0, cuts.length - 1);
  const lastTime = cuts[last]?.time || 0;
  const prePre = last >= 1 ? cuts.slice(0, last - 1).reduce((s, c) => s + (c.time || 0), 0) : 0;
  return { index: last, preTimeSum: timeTotal - lastTime, timeSum: timeTotal, prePreTimeSum: prePre };
};

export const Preview: React.FC = React.memo(() => {
  const t = useT();
  const cuts = usePsd();
  const isLoading = useGlobal('isLoading')[0];
  const { frame: projectFrame, fps } = useProject();
  // フィット計算の基準は既定キャンバス（作品フレームの1.25倍）
  const fitBase = defaultCanvasSize(projectFrame);

  const [frame, setFrame] = useState(0);
  const [isPlay, setIsPlay] = useState(false);
  const viewport = useViewportSize();
  const ratio = Math.min((viewport.width - 340) / fitBase.width, (viewport.height - 419) / fitBase.height);

  const now = window.performance && performance.now;

  const timeTotal = cuts?.reduce((sum, i) => (i.time && sum + i.time) || sum, 0) || 0;

  const animationRef: React.MutableRefObject<number> = useRef(0);
  const timeRef: React.MutableRefObject<number> = useRef(0);

  // 共有コンポジタ用のバッファ（ネイティブ寸・1度だけ確保して使い回す＝GC 抑制）
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buffersRef = useRef<Buffers | null>(null);

  const rewind = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    setIsPlay(false);
    setFrame(0);
  }, []);
  const fastForward = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    setIsPlay(false);
    if (!timeTotal) return;
    setFrame(timeTotal - 1);
  }, [timeTotal]);
  const step = useCallback(
    (time: number) => {
      cancelAnimationFrame(animationRef.current);
      setIsPlay(false);
      if (!timeTotal) return;
      setFrame(clampFrame(time, timeTotal));
    },
    [timeTotal],
  );

  const stop = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    setIsPlay(false);
  }, []);

  const start = useCallback(() => {
    const getTime = () => (now && now.call(performance)) || new Date().getTime();

    timeRef.current = getTime();
    const loop = () => {
      animationRef.current = requestAnimationFrame(loop);
      const playFrame = (getTime() - timeRef.current) / (1000 / fps);
      if (!timeTotal) return;
      if (frame >= timeTotal - 1) {
        cancelAnimationFrame(animationRef.current);
        setIsPlay(false);
      }
      setFrame(frame + playFrame);
    };
    loop();
    setIsPlay(true);
  }, [frame, now, timeTotal, fps]);

  // 単一の描画パス: frameState → compositeFrame（共有コンポジタ）→ 可視 canvas へ blit。
  // カメラワーク・黒/白フェード・背景・グループ・ブレンドはすべて compositeFrame が担う。
  // 動画書き出しと同一関数を通すため、プレビュー=書き出しがピクセル一致する。
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = projectFrame.width;
    const h = projectFrame.height;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const b = buffersRef.current;
    const buffers: Buffers =
      b && b.w === w && b.h === h
        ? b
        : {
            w,
            h,
            out: new OffscreenCanvas(w, h),
            scratch: new OffscreenCanvas(w, h),
            frameBuffer: new OffscreenCanvas(w, h),
            unitScratch: new OffscreenCanvas(w, h),
          };
    buffersRef.current = buffers;

    const state = frameState(frame, cuts);
    compositeFrame(state, cuts, { width: w, height: h }, buffers.out, buffers.scratch, buffers.frameBuffer, buffers.unitScratch);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(buffers.out, 0, 0);
  }, [frame, cuts, projectFrame]);

  // 再生終端で停止
  useEffect(() => {
    if (!timeTotal) return;
    if (frame >= timeTotal - 1) {
      cancelAnimationFrame(animationRef.current);
      setIsPlay(false);
    }
  }, [frame, timeTotal]);

  // 再生位置のカット index を Dialogue パネルへ共有する（変化時のみ）
  const setCurrentCutIndex = useGlobal('currentCutIndex')[1];
  const lastCutIndexRef = useRef(-1);
  useEffect(() => {
    let sum = 0;
    let index = 0;
    for (let i = 0; i < cuts.length; i++) {
      const time = cuts[i].time || 0;
      index = i;
      if (frame < sum + time) break;
      sum += time;
    }
    if (index !== lastCutIndexRef.current) {
      lastCutIndexRef.current = index;
      setCurrentCutIndex(index);
    }
  }, [frame, cuts, setCurrentCutIndex]);

  const info = activeCutInfo(frame, cuts, timeTotal);

  return (
    <Flex direction="column" height="100%">
      <>
        {isLoading && (
          <Flex direction="column" alignItems="center" justifyContent="center" height={viewport.height - 42}>
            <ProgressCircle aria-label={t('common.loading.ariaLabel')} isIndeterminate size="L" />
            <Heading>{t('common.loading.heading')}</Heading>
          </Flex>
        )}
        {cuts.length > 0 && (
          <div>
            <Flex direction="column" alignItems="center" margin="size-0">
              <PreviewHeader style={{ width: `${projectFrame.width * ratio}px` }}>
                <CountIn>{frameToTimecode(info.preTimeSum, fps)}</CountIn>
                <Heading>{`Cut${('00' + (info.index + 1)).slice(-3)}`}</Heading>
                <CountOut>{frameToTimecode(info.timeSum, fps)}</CountOut>
              </PreviewHeader>

              <div
                style={{
                  height: `${projectFrame.height * ratio}px`,
                  width: `${projectFrame.width * ratio}px`,
                  backgroundColor: '#000',
                  overflow: 'hidden',
                }}
              >
                {/* 可視 canvas はネイティブ寸。CSS で ratio 縮小表示（合成は compositeFrame が担う） */}
                <canvas
                  ref={canvasRef}
                  style={{
                    width: `${projectFrame.width * ratio}px`,
                    height: `${projectFrame.height * ratio}px`,
                    display: 'block',
                  }}
                />
              </div>
            </Flex>
            <Flex direction="column" alignItems="center" marginTop="size-0">
              <PreviewHeader style={{ width: `${projectFrame.width * ratio}px` }}>
                <CountIn>{frameToTimecode(frame, fps)}</CountIn>
                <div>
                  <ActionButton isQuiet onPress={rewind}>
                    <Rewind size="M" />
                  </ActionButton>
                  <ActionButton isQuiet onPress={() => step(info.prePreTimeSum)}>
                    <StepBackward size="M" />
                  </ActionButton>
                  <ActionButton isQuiet onPress={isPlay ? stop : start}>
                    {isPlay ? <Pause size="M" /> : <Play size="M" />}
                  </ActionButton>
                  <ActionButton isQuiet onPress={() => step(info.timeSum)}>
                    <StepForward size="M" />
                  </ActionButton>
                  <ActionButton isQuiet onPress={fastForward}>
                    <FastForward size="M" />
                  </ActionButton>
                </div>
                <CountOut>{frameToTimecode(timeTotal, fps)}</CountOut>
              </PreviewHeader>
            </Flex>
          </div>
        )}
        <Flex
          direction="column"
          width="100%"
          height="288px"
          marginTop="auto"
          marginBottom="size-0"
          gap="size-20"
          position="relative"
        >
          <Timeline frame={frame} timeTotal={timeTotal} setFrame={setFrame}></Timeline>
        </Flex>
      </>
    </Flex>
  );
});
