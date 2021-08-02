import React, { useGlobal, useState, useEffect, useMemo } from 'reactn';
import { Heading, Flex, ProgressCircle } from '@adobe/react-spectrum';
import styled from 'styled-components';
import { readPsd, Psd, Layer } from 'ag-psd';

const { api } = window;

const CutNumber = styled.div`
  position: absolute;
  color: #2c2c2c;
  z-index: 2;
`;

const ToolArea = styled.div`
  background-color: var(--spectrum-alias-toolbar-background-color);
  height: 100%;
  width: 100%;
  overflow-x: scroll;
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
`;

const Bar = styled.div`
  height: 288px;
  border-right: 2px solid var(--spectrum-semantic-negative-color-border);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
`;

const TimelineContainer: React.FC = React.memo(() => {
  const prtPsd: Psd = { width: 1, height: 1 };
  const prtCut: Cut = {
    picture: prtPsd,
  };
  const [cuts, setCuts] = useState([prtCut]);
  const globalCuts = useGlobal('globalCuts')[0];
  const globalPsds = useGlobal('globalPsds')[0];

  const [width, setWidth] = useState(window.innerWidth - 340);

  window.addEventListener('resize', () => setWidth(window.innerWidth - 340));

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
            const element = document.getElementById(`CCC${index + 1}PPP${child.name}`) || document.createElement('div');
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

  const timeTotal = cuts?.reduce((sum, i) => i.time && sum + i.time, 0) || 0;
  const range = (start: number, end: number) => [...new Array(end - start).keys()].map((n) => n + start);

  return (
    <>
      <TimelineArea style={{ width: `${width}px` }}>
        {range(0, timeTotal)
          .filter((n) => n % 120 === 0)
          .map((n) => (
            <ScaleNumber style={{ left: `${n * 2}px` }}>
              {n > 24 ? n / 24 + ':' + ('00' + (n % 24)).slice(-2) : ('00' + n).slice(-2)}
            </ScaleNumber>
          ))}
      </TimelineArea>
      <TimelineArea style={{ width: `${width}px` }}>
        {range(0, timeTotal)
          .filter((n) => n % 12 === 0)
          .map((n) => (
            <Scale style={{ left: `${n * 2}px`, top: '16px', width: '24px' }} />
          ))}
      </TimelineArea>
      <TimelineArea style={{ width: `${width}px` }}>
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
            const preTimeSum = cuts.slice(0, index).reduce((sum, i) => i.time && sum + i.time, 0) || 0;
            const time = cut?.time || 0;
            return (
              <CutArea style={{ left: `${preTimeSum * 2}px`, top: '24px', width: `${time * 2}px`, overflow: 'hidden' }}>
                {cut.picture?.children
                  ?.filter((child: Psd['children'], layerindex: number) => layerindex !== 0)
                  .map((child: Layer) => {
                    const src = child.canvas?.toDataURL('image/png', 0.4);
                    return (
                      <>
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
                            id={`CCC${index + 1}PPP${child.name}`}
                          >
                            {!api && (
                              <img
                                style={{ transform: 'scale(0.12)', transformOrigin: 'left top' }}
                                src={src}
                                alt="cut"
                              />
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })}
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

export const Timeline: React.FC<{ frame: number }> = React.memo(({ frame }) => {
  const frame2 = useMemo(() => {
    return `${frame * 2}px`;
  }, [frame]);

  useEffect(() => {
    const bar = document.getElementById('bar') || document.createElement('div');
    bar.style.left = frame2;
  }, [frame2]);
  return (
    <ToolArea>
      <TimelineContainer />
      <Bar id="bar" />
    </ToolArea>
  );
});
