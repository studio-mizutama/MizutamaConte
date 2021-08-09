import React, { useState, useEffect } from 'reactn';
import { Heading, Flex, ProgressCircle } from '@adobe/react-spectrum';
import styled from 'styled-components';
import { Psd, Layer } from 'ag-psd';
import { usePsd } from 'hooks/usePsd';

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
  top: 16px;
`;

const TimelineContainer: React.FC<{ scale: number }> = React.memo(({ scale }) => {
  const prtPsd: Psd = { width: 1, height: 1 };
  const prtCut: Cut = {
    picture: prtPsd,
  };
  const cuts = usePsd(prtCut);

  const [width, setWidth] = useState(window.innerWidth - 340);

  window.addEventListener('resize', () => setWidth(window.innerWidth - 340));

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
          .filter((n) => n % (240 / scale) === 0)
          .map((n) => (
            <ScaleNumber key={n} style={{ left: `${n * scale + 2}px` }}>
              {n > 24 ? ((n / 24) | 0) + ':' + ('00' + (n % 24)).slice(-2) : ('00' + n).slice(-2)}
            </ScaleNumber>
          ))}
      </TimelineArea>
      <TimelineArea style={{ width: `${width}px` }}>
        {range(0, timeTotal)
          .filter((n) => n % ((24 / scale) | 0) === 0)
          .map((n) => (
            <Scale key={n} style={{ left: `${n * scale}px`, top: '32px', width: '24px' }} />
          ))}
        {range(0, timeTotal)
          .filter((n) => n % (240 / scale) === 0)
          .map((n) => (
            <Scale key={n} style={{ left: `${n * scale}px`, top: '24px', width: '24px' }} />
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
              <CutArea
                style={{ left: `${preTimeSum * scale}px`, top: '40px', width: `${time * scale}px`, overflow: 'hidden' }}
                key={index}
              >
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
                        key={`CCC${index + 1}PPP${child.name}`}
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

  return (
    <ToolArea>
      <TimelineContainer scale={scale} />
      <Slide
        type="range"
        id="slide"
        value={frame}
        min="0"
        max={timeTotal}
        onChange={setCurrentFrame}
        style={{ width: `${timeTotal * scale}px` }}
      />
    </ToolArea>
  );
});
