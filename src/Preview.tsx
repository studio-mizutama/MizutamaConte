import React, { useGlobal, useState, useEffect, useCallback, useRef } from 'reactn';
import { ActionButton, Heading, Flex, ProgressCircle } from '@adobe/react-spectrum';
import styled from 'styled-components';
import { readPsd, Psd, Layer } from 'ag-psd';
import Rewind from '@spectrum-icons/workflow/Rewind';
import StepBackward from '@spectrum-icons/workflow/StepBackward';
import Play from '@spectrum-icons/workflow/Play';
import Pause from '@spectrum-icons/workflow/Pause';
import StepForward from '@spectrum-icons/workflow/StepForward';
import FastForward from '@spectrum-icons/workflow/FastForward';
import { Timeline } from 'Timeline';

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

  const [frame, setFrame] = useState(0);
  const [isPlay, setIsPlay] = useState(false);
  const [ratio, setRatio] = useState(
    (window.innerWidth - 340) / 2400 > (window.innerHeight - 419) / 1350
      ? (window.innerHeight - 419) / 1350
      : (window.innerWidth - 340) / 2400,
  );

  window.addEventListener('resize', () =>
    setRatio(
      (window.innerWidth - 340) / 2400 > (window.innerHeight - 419) / 1350
        ? (window.innerHeight - 419) / 1350
        : (window.innerWidth - 340) / 2400,
    ),
  );

  const now = window.performance && performance.now;
  const fps = 24;

  const timeTotal = cuts?.reduce((sum, i) => i.time && sum + i.time, 0);

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
    setFrame(timeTotal - 1);
  }, [timeTotal]);
  const step = useCallback(
    (time: number) => {
      cancelAnimationFrame(animationRef.current);
      setIsPlay(false);
      if (!timeTotal) return;
      if (time >= timeTotal) time = timeTotal - 1;
      setFrame(time);
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
  }, [globalCuts, globalPsds]);

  useEffect(() => {
    cuts?.length > 1 &&
      cuts.map((cut, index) => {
        const preTimeSum = cuts.slice(0, index).reduce((sum, i) => i.time && sum + i.time, 0) || 0;
        const pictureNumber = cut.picture?.children && cut.picture?.children.length - 1;
        const time = cut.time || 0;
        const pictureShowDuration = cut.time && cut.time / pictureNumber;
        const scaleIn = cut.cameraWork?.scale?.in || 1;
        const scaleOut = cut.cameraWork?.scale?.out || 1;
        const currentFrame = frame - preTimeSum || 1;
        const scale = scaleIn - ((scaleIn - scaleOut) * currentFrame) / time;
        const fadeInDuration = cut.action?.fadeInDuration || 0;
        const fadeOutDuration = cut.action?.fadeOutDuration || 0;
        const fadeOutTime = time - fadeOutDuration;
        const setOpacity = (currentFrame: number): number => {
          if (0 <= currentFrame && currentFrame < fadeInDuration) return currentFrame / fadeInDuration;
          if (time - fadeOutDuration <= currentFrame && currentFrame <= time)
            return 1 - (currentFrame - fadeOutTime) / fadeOutDuration;
          return 1;
        };
        const opacity = setOpacity(currentFrame);
        cut.picture?.children
          ?.filter((child: Psd['children'], layerindex: number) =>
            pictureShowDuration
              ? layerindex === Math.trunc(((frame - preTimeSum) / pictureShowDuration) | 0) + 1
              : layerindex === 1,
          )
          .map((child: Layer) => {
            const element = document.getElementById(`c${index + 1}p${child.name}`) || document.createElement('div');
            const canvas = child.canvas || document.createElement('canvas');
            canvas.style.width = `${(canvas.width * ratio) / scale}px`;
            canvas.style.opacity = opacity.toString();
            element.innerHTML = '';
            element.appendChild(canvas);
            return 0;
          });
        return 0;
      });
  }, [cuts, frame, ratio]);

  useEffect(() => {
    if (!timeTotal) return;
    if (frame >= timeTotal - 1) {
      cancelAnimationFrame(animationRef.current);
      setIsPlay(false);
    }
  }, [frame, timeTotal]);

  return (
    <Flex direction="column" height="100%">
      <>
        {!api && cuts?.length > 1 && !cuts[1]?.picture && (
          <Flex direction="column" alignItems="center" justifyContent="center" height={window.innerHeight - 42}>
            <ProgressCircle aria-label="Loading…" isIndeterminate size="L" />
            <Heading>Now Loading...</Heading>
          </Flex>
        )}
        {api && cuts?.length === 1 && (
          <Flex direction="column" alignItems="center" justifyContent="center" height={window.innerHeight - 42}>
            <ProgressCircle aria-label="Loading…" isIndeterminate size="L" />
            <Heading>Now Loading...</Heading>
          </Flex>
        )}
        {cuts?.length > 1 &&
          cuts.map((cut, index) => {
            const prePreTimeSum = cuts.slice(0, index - 1).reduce((sum, i) => i.time && sum + i.time, 0) || 0;
            const preTimeSum = cuts.slice(0, index).reduce((sum, i) => i.time && sum + i.time, 0) || 0;
            const timeSum = cuts.slice(0, index + 1).reduce((sum, i) => i.time && sum + i.time, 0) || timeTotal || 0;
            const pictureNumber = cut.picture?.children && cut.picture?.children.length - 1;
            const time = cut?.time || 0;
            const pictureShowDuration = time / pictureNumber;
            const scaleIn = cut.cameraWork?.scale?.in || 1;
            const scaleOut = cut.cameraWork?.scale?.out || 1;
            const currentFrame = frame - preTimeSum || 1;
            const scale = scaleIn - ((scaleIn - scaleOut) * currentFrame) / time;
            const xIn = cut.cameraWork?.position?.in.x || 0;
            const xOut = cut.cameraWork?.position?.out.x || 0;
            const yOut = cut.cameraWork?.position?.in.y || 0;
            const yIn = cut.cameraWork?.position?.out.y || 0;
            const posX = xIn - ((xIn - xOut) * currentFrame) / time;
            const posY = yOut - ((yOut - yIn) * currentFrame) / time;
            const fadeInDuration = cut.action?.fadeInDuration || 0;
            const fadeOutDuration = cut.action?.fadeOutDuration || 0;
            const fadeOutTime = time - fadeOutDuration;
            const setOpacity = (currentFrame: number): number => {
              if (0 <= currentFrame && currentFrame < fadeInDuration) return currentFrame / fadeInDuration;
              if (time - fadeOutDuration <= currentFrame && currentFrame <= time)
                return 1 - (currentFrame - fadeOutTime) / fadeOutDuration;
              return 1;
            };
            const opacity =
              cut.action?.fadeIn === 'Black In' || cut.action?.fadeOut === 'Black Out' ? setOpacity(currentFrame) : 1;

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
                      //const src = child.canvas?.toDataURL('image/jxss', 1);
                      return (
                        <>
                          <Flex direction="column" alignItems="center" margin="size-0">
                            <PreviewHeader style={{ width: `${1920 * ratio}px` }}>
                              <CountIn>{`${
                                preTimeSum! > 24
                                  ? ((preTimeSum! / 24) | 0) + ':' + ('00' + (preTimeSum! % 24)).slice(-2)
                                  : ('00' + preTimeSum).slice(-2)
                              }`}</CountIn>
                              <Heading>{`Cut${('00' + (index + 1)).slice(-3)}`}</Heading>
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
                                  height: `${child.canvas && (child.canvas.height * ratio) / scale}px`,
                                  width: `${child.canvas && (child.canvas.width * ratio) / scale}px`,
                                  backgroundColor: '#fff',
                                  opacity: `${opacity}`,
                                  position: 'relative',
                                  bottom: `${
                                    child.canvas && (child.canvas.height * ratio - 1080 * ratio * (scale - posY)) / 2
                                  }px`,
                                  right: `${
                                    child.canvas && (child.canvas.width * ratio - 1920 * ratio * (scale - posX)) / 2
                                  }px`,
                                }}
                                id={`c${index + 1}p${child.name}`}
                              ></div>
                            </div>
                          </Flex>
                          <Flex direction="column" alignItems="center" marginTop="size-0">
                            <PreviewHeader style={{ width: `${1920 * ratio}px` }}>
                              <CountIn>{`${
                                frame! > 24
                                  ? ((frame! / 24) | 0) + ':' + ('00' + (Math.round(frame!) % 24)).slice(-2)
                                  : ('00' + Math.round(frame)).slice(-2)
                              }`}</CountIn>
                              <div>
                                <ActionButton isQuiet onPress={rewind}>
                                  <Rewind size="M" />
                                </ActionButton>
                                <ActionButton isQuiet onPress={() => step(prePreTimeSum)}>
                                  <StepBackward size="M" />
                                </ActionButton>
                                <ActionButton isQuiet onPress={isPlay ? stop : start}>
                                  {isPlay ? <Pause size="M" /> : <Play size="M" />}
                                </ActionButton>
                                <ActionButton isQuiet onPress={() => step(timeSum)}>
                                  <StepForward size="M" />
                                </ActionButton>
                                <ActionButton isQuiet onPress={fastForward}>
                                  <FastForward size="M" />
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
                    })}
              </>
            );
          })}
        <Flex
          direction="column"
          width="100%"
          height="288px"
          marginTop="auto"
          marginBottom="size-0"
          gap="size-20"
          position="relative"
        >
          <Timeline frame={frame}></Timeline>
        </Flex>
      </>
    </Flex>
  );
});
