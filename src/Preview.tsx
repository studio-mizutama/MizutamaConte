import React, { useGlobal, useState, useEffect, useCallback, useRef } from 'reactn';
import { ActionButton, Heading, View, Flex, ProgressCircle } from '@adobe/react-spectrum';
import styled from 'styled-components';
import { readPsd, Psd, Layer } from 'ag-psd';
import Rewind from '@spectrum-icons/workflow/Rewind';
import StepBackward from '@spectrum-icons/workflow/StepBackward';
import Play from '@spectrum-icons/workflow/Play';
import Pause from '@spectrum-icons/workflow/Pause';
import StepForward from '@spectrum-icons/workflow/StepForward';
import FastForward from '@spectrum-icons/workflow/FastForward';

const { api } = window;

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

export const Preview: React.FC = React.memo(() => {
  const prtPsd: Psd = { width: 1, height: 1 };
  const prtCut: Cut = {
    picture: prtPsd,
  };
  const [cuts, setCuts] = useState([prtCut]);
  const globalCuts = useGlobal('globalCuts')[0];
  const globalPsds = useGlobal('globalPsds')[0];

  const [frame, setFrame] = useState(1);
  const [isPlay, setIsPlay] = useState(false);
  const [ratio, setRatio] = useState((window.innerWidth - 340) / 2400 > 1 ? 1 : (window.innerWidth - 340) / 2400);

  window.addEventListener('resize', () =>
    setRatio((window.innerWidth - 340) / 2400 > 1 ? 1 : (window.innerWidth - 340) / 2400),
  );

  const now = window.performance && performance.now;
  const fps = 24;

  const timeTotal = cuts.reduce((sum, i) => i.time && sum + i.time, 0);

  const animationRef: React.MutableRefObject<number> = useRef(0);
  const timeRef: React.MutableRefObject<number> = useRef(0);

  const rewind = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    setIsPlay(false);
    setFrame(0);
  }, []);
  const fastForward = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    setIsPlay(false);
    if (!timeTotal) return;
    setFrame(timeTotal);
  }, [timeTotal]);

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
      if (frame > timeTotal) {
        cancelAnimationFrame(animationRef.current);
        setIsPlay(false);
        return;
      }
      setFrame(frame + playFrame);
    };
    loop();
    setIsPlay(true);
  }, [frame, now, timeTotal]);

  useEffect(() => {
    const f = async () => {
      const joinBy = (arr1: Cut[], arr2: Cut[]) => {
        const arr2Dict = new Map(arr2?.map((o, index) => [index, o]));
        return arr1?.map((item, index) => ({ ...item, ...arr2Dict.get(index) }));
      };
      if (!api) {
        const psds = globalPsds;
        const cutsWithNoPicture: Cut[] = globalCuts;
        const cutsWithNoJson: Cut[] = psds?.map((psd) => {
          return { picture: psd };
        });
        const cuts = joinBy(cutsWithNoPicture, cutsWithNoJson);
        setCuts(cuts);
        return;
      }
      const psdfiles = await api.loadPSD();
      const json = await api.loadJSON();
      const psds = psdfiles?.map((psdfile) => readPsd(psdfile));
      const cutsWithNoPicture: Cut[] = json;
      const cutsWithNoJson: Cut[] = psds?.map((psd) => {
        return { picture: psd };
      });

      const cuts = joinBy(cutsWithNoPicture, cutsWithNoJson);
      setCuts(cuts);
    };
    f();
  }, [globalCuts, globalPsds, setCuts]);

  return (
    <>
      {!api && cuts?.length > 1 && !cuts[1]?.picture && (
        <Flex direction="column" alignItems="center" justifyContent="center" height="100%">
          <ProgressCircle aria-label="Loading…" isIndeterminate size="L" />
          <Heading>Now Loading...</Heading>
        </Flex>
      )}
      {api && cuts?.length === 1 && (
        <Flex direction="column" alignItems="center" justifyContent="center" height="100%">
          <ProgressCircle aria-label="Loading…" isIndeterminate size="L" />
          <Heading>Now Loading...</Heading>
        </Flex>
      )}
      {cuts?.length > 1 &&
        cuts.map((cut, index) => {
          const preTimeSum = cuts.slice(0, index).reduce((sum, i) => i.time && sum + i.time, 0);
          const timeSum = cuts.slice(0, index + 1).reduce((sum, i) => i.time && sum + i.time, 0);
          const pictureNumber = cut.picture?.children.length - 1;
          const pictureShowDuration = cut?.time && cut?.time / pictureNumber;
          return (
            <>
              {preTimeSum !== undefined &&
                timeSum !== undefined &&
                preTimeSum <= frame &&
                frame < timeSum &&
                cut.picture?.children
                  ?.filter((child: Psd['children'], layerindex: number) =>
                    pictureShowDuration
                      ? layerindex === Math.trunc(((frame - preTimeSum) / pictureShowDuration) | 0) + 1
                      : layerindex === 1,
                  )
                  .map((child: Layer) => {
                    const src = child.canvas?.toDataURL('image/png', 0.2);
                    return (
                      <Flex direction="column" alignItems="center" justifyContent="center" height="100%">
                        <PreviewHeader style={{ width: `${1920 * ratio}px` }}>
                          <CountIn>{`${
                            preTimeSum! > 24
                              ? ((preTimeSum! / 24) | 0) + ':' + ('00' + (preTimeSum! % 24)).slice(-2)
                              : ('00' + preTimeSum).slice(-2)
                          }`}</CountIn>
                          <Heading>{('Cut00' + (index + 1)).slice(-6)}</Heading>
                          <CountOut>{`${
                            timeSum! > 24
                              ? ((timeSum! / 24) | 0) + ':' + ('00' + (timeSum! % 24)).slice(-2)
                              : ('00' + timeSum).slice(-2)
                          }`}</CountOut>
                        </PreviewHeader>

                        <div
                          style={{
                            height: `${1080 * ratio}px`,
                            width: `${1920 * ratio}px`,
                            backgroundColor: '#000',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: `${child.canvas && child.canvas.height * ratio}px`,
                              width: `${child.canvas && child.canvas.width * ratio}px`,
                              backgroundColor: '#fff',
                              position: 'relative',
                            }}
                          >
                            <img
                              style={{ transform: `scale(${ratio})`, transformOrigin: 'left top' }}
                              src={src}
                              alt="cut"
                            />
                          </div>
                        </div>
                      </Flex>
                    );
                  })}
            </>
          );
        })}
      <Flex direction="column" alignItems="center" justifyContent="center" height="100%">
        <PreviewHeader style={{ width: `${1920 * ratio}px` }}>
          <CountIn>{`${
            frame! > 24
              ? ((frame! / 24) | 0) + ':' + ('00' + (Math.round(frame!) % 24)).slice(-2)
              : ('00' + Math.round(frame)).slice(-2)
          }`}</CountIn>
          <div>
            <ActionButton isQuiet onPress={rewind}>
              <Rewind />
            </ActionButton>
            <ActionButton isQuiet>
              <StepBackward />
            </ActionButton>
            <ActionButton isQuiet onPress={isPlay ? stop : start}>
              {isPlay ? <Pause /> : <Play />}
            </ActionButton>
            <ActionButton isQuiet>
              <StepForward />
            </ActionButton>
            <ActionButton isQuiet onPress={fastForward}>
              <FastForward />
            </ActionButton>
          </div>
          <CountOut>{`${
            timeTotal! > 24
              ? ((timeTotal! / 24) | 0) + ':' + ('00' + (timeTotal! % 24)).slice(-2)
              : ('00' + timeTotal).slice(-2)
          }`}</CountOut>
        </PreviewHeader>
      </Flex>
    </>
  );
});
