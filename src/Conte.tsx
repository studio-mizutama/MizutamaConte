import React, { useGlobal, useState, useEffect } from 'reactn';
import { Grid, Heading, View, Flex, ProgressCircle } from '@adobe/react-spectrum';
import styled from 'styled-components';
import { readPsd, Psd, Layer } from 'ag-psd';

const Scroll = styled.div`
  height: calc(100vh - 82px);
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
`;

const MyTextArea = styled.textarea`
  position: absolute;
  top: 2px;
  height: calc(100% - 4px);
  width: calc(100% - 4px);
  resize: none;
  background: none;
  margin: 0;
  padding: 0;
  border: none;

  :focus {
    outline: 2px solid var(--spectrum-alias-border-color-focus);
    border-radius: var(--spectrum-global-dimension-size-50, var(--spectrum-alias-size-50));
  }
`;

const In = styled.div`
  color: var(--spectrum-semantic-positive-color-border);
  border: 2px solid var(--spectrum-semantic-positive-color-border);
  border-radius: var(--spectrum-global-dimension-size-50, var(--spectrum-alias-size-50));
  position: absolute;
  z-index: 2;
`;

const Out = styled.div`
  color: var(--spectrum-semantic-negative-color-border);
  border: 2px solid var(--spectrum-semantic-negative-color-border);
  border-radius: var(--spectrum-global-dimension-size-50, var(--spectrum-alias-size-50));
  position: absolute;
  z-index: 3;
`;

const Fade = styled.svg`
  padding: 0;
  margin: 0;
  stroke: none;
  fill: var(--spectrum-alias-text-color);
  position: absolute;
  left: calc((100% - 96px) / 2);
`;

const TextContainer: React.FC<{ action?: Action; dialogue?: string; time?: number; timeSum?: number }> = ({
  action,
  dialogue,
  time,
  timeSum,
}) => {
  const tool = useGlobal('tool')[0] as Set<string>;
  const escKeyDown = (e: React.KeyboardEvent) => {
    const activeElement = document.activeElement as HTMLElement;
    e.key === 'Escape' && activeElement.blur();
  };
  return (
    <>
      <View gridArea="action" width="100%" position="relative" height="auto">
        <MyTextArea className={tool.has('Text') ? 'hover' : ''} disabled={!tool.has('Text')} onKeyDown={escKeyDown}>
          {`${action?.fadeIn ? action?.fadeIn : ''}\n${action?.fadeInDuration ? action?.fadeInDuration : ''}\n${
            action?.fadeOut ? action?.fadeOut : ''
          }\n${action?.fadeOutDuration ? action?.fadeOutDuration : ''}\n${action?.text ? action?.text : ''}\n`}
        </MyTextArea>
        {action?.fadeIn && (
          <Fade viewBox="0 0 96 48" width="96px">
            <path d="M48,2.83,91.17,46H4.83L48,2.83M48,0,0,48H96L48,0Z" />
          </Fade>
        )}
        {action?.fadeOut && (
          <Fade viewBox="0 0 96 48" width="96px" style={{ bottom: 0 }}>
            <path d="M91.17,2,48,45.17,4.83,2H91.17M96,0Zm0,0H0L48,48,96,0Z" />
          </Fade>
        )}
      </View>
      <View gridArea="dialogue" width="100%" position="relative" height="auto">
        <MyTextArea className={tool.has('Text') ? 'hover' : ''} disabled={!tool.has('Text')} onKeyDown={escKeyDown}>
          {dialogue}
        </MyTextArea>
      </View>
      <View gridArea="time" width="100%" position="relative" height="auto">
        <MyTextArea className={tool.has('Text') ? 'hover' : ''} disabled={!tool.has('Text')} onKeyDown={escKeyDown}>
          {`${time! > 24 ? ((time! / 24) | 0) + ':' + ('00' + (time! % 24)).slice(-2) : ('00' + time).slice(-2)}\n${
            timeSum! > 24
              ? ((timeSum! / 24) | 0) + ':' + ('00' + (timeSum! % 24)).slice(-2)
              : ('00' + timeSum).slice(-2)
          }`}
        </MyTextArea>
      </View>
    </>
  );
};

const { api } = window;

const CutContainer: React.FC = () => {
  const prtPsd: Psd = { width: 1, height: 1 };
  const prtCut: Cut = {
    picture: prtPsd,
  };
  const [cuts, setCuts] = useState([prtCut]);
  const globalCuts = useGlobal('globalCuts')[0];
  const globalPsds = useGlobal('globalPsds')[0];

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

  useEffect(() => {
    api &&
      cuts?.map((cut, index) => {
        cut.picture?.children
          ?.filter((child: Psd['children'], layerindex: number) => layerindex !== 0)
          .map((child: Layer) => {
            const element = document.getElementById(`CC${index + 1}PP${child.name}`) || document.createElement('div');
            const canvas = child.canvas || document.createElement('canvas');
            canvas.style.width = `${canvas.width * 0.12}px`;
            element.innerHTML = '';
            element.style.backgroundColor = '#FFF';
            element.appendChild(canvas);
            return 0;
          });
        return 0;
      });
  }, [cuts]);

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
          const timeSum = cuts.slice(0, index + 1).reduce((sum, i) => i.time && sum + i.time, 0);
          return (
            <View backgroundColor="gray-100">
              <div
                className={'hover'}
                id={`Cut${index + 1}`}
                onClick={() => document.getElementById(`List${index + 1}`)?.click()}
                onMouseEnter={() => document.getElementById(`List${index + 1}`)?.classList.add('isHover')}
                onMouseLeave={() => document.getElementById(`List${index + 1}`)?.classList.remove('isHover')}
              >
                <Grid
                  columns={['72px', '288px', 'auto', 'auto', '128px']}
                  areas={['cut picture action dialogue time']}
                  gap="size-200"
                  height="auto"
                  marginBottom="size-25"
                >
                  <View gridArea="cut" width="100%" height="auto">
                    <Flex direction="column" alignItems="center">
                      <Heading>{('00' + (index + 1)).slice(-3)}</Heading>
                    </Flex>
                  </View>
                  <View gridArea="picture" width="100%" height="auto">
                    {cut.picture?.children
                      ?.filter((child: Psd['children'], layerindex: number) => layerindex !== 0)
                      .map((child: Layer) => {
                        const src = child.canvas?.toDataURL('image/png', 0.4);
                        return (
                          <div
                            style={{
                              height: `${child.canvas && child.canvas.height * 0.12}px`,
                              width: `${child.canvas && child.canvas.width * 0.12}px`,
                              position: 'relative',
                            }}
                          >
                            <div
                              style={{
                                height: `${child.canvas && child.canvas.height * 0.12}px`,
                                width: `${child.canvas && child.canvas.width * 0.12}px`,
                                position: 'relative',
                                background: `${api ? 'none' : '#FFF'}`,
                              }}
                              id={`CC${index + 1}PP${child.name}`}
                            >
                              {!api && (
                                <img
                                  style={{ transform: 'scale(0.12)', transformOrigin: 'left top' }}
                                  src={src}
                                  alt="cut"
                                />
                              )}
                            </div>
                            {cut.cameraWork && (
                              <>
                                <In
                                  style={{
                                    height: `${129.6 * cut.cameraWork.scale!.in}px`,
                                    width: `${230.4 * cut.cameraWork.scale!.in}px`,
                                    top: `${
                                      child.canvas &&
                                      (child.canvas.height * 0.12 -
                                        129.6 * (cut.cameraWork.scale!.in - cut.cameraWork.position!.in!.y!)) /
                                        2
                                    }px`,
                                    left: `${
                                      child.canvas &&
                                      (child.canvas.width * 0.12 -
                                        230.4 * (cut.cameraWork.scale!.in - cut.cameraWork.position!.in!.x!)) /
                                        2
                                    }px`,
                                  }}
                                >
                                  <Heading level={4} margin="size-25">
                                    IN
                                  </Heading>
                                </In>
                                <Out
                                  style={{
                                    height: `${129.6 * cut.cameraWork.scale!.out}px`,
                                    width: `${230.4 * cut.cameraWork.scale!.out}px`,
                                    top: `${
                                      child.canvas &&
                                      (child.canvas.height * 0.12 -
                                        129.6 * (cut.cameraWork.scale!.out - cut.cameraWork.position!.out!.y!)) /
                                        2
                                    }px`,
                                    left: `${
                                      child.canvas &&
                                      (child.canvas.width * 0.12 -
                                        230.4 * (cut.cameraWork.scale!.out - cut.cameraWork.position!.out!.x!)) /
                                        2
                                    }px`,
                                  }}
                                >
                                  <Heading level={4} margin="size-25">
                                    OUT
                                  </Heading>
                                </Out>
                              </>
                            )}
                          </div>
                        );
                      })}
                  </View>
                  <TextContainer action={cut?.action} dialogue={cut?.dialogue} time={cut?.time} timeSum={timeSum} />
                </Grid>
              </div>
            </View>
          );
        })}
    </>
  );
};

export const Conte: React.FC = React.memo(() => {
  return (
    <>
      <Grid columns={['72px', '288px', 'auto', 'auto', '128px']} rows={['size-500']} height="size-500" gap="size-200">
        <Heading alignSelf="center" justifySelf="center">
          CUT
        </Heading>
        <Heading alignSelf="center" justifySelf="center">
          PICTURE
        </Heading>
        <Heading alignSelf="center" justifySelf="center">
          ACTION
        </Heading>
        <Heading alignSelf="center" justifySelf="center">
          DIALOGUE
        </Heading>
        <Heading alignSelf="center" justifySelf="center">
          TIME
        </Heading>
      </Grid>

      <Scroll>
        <CutContainer />
      </Scroll>
    </>
  );
});
