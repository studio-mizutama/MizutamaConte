import React, { useGlobal, useState, useRef } from 'reactn';
import { ActionButton, Grid, Heading, View, Flex, ProgressCircle } from '@adobe/react-spectrum';
import styled from 'styled-components';
import { Psd, Layer } from 'ag-psd';
import Add from '@spectrum-icons/workflow/Add';
import { usePsd } from 'hooks/usePsd';
import { useProject } from 'hooks/useProject';
import { useProjectActions } from 'hooks/useProjectActions';
import { thumbnailScale } from 'project/dimensions';
import { frameToTimecode, parseTimecode } from 'project/time';

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

const TimeSum = styled.div`
  position: absolute;
  bottom: 4px;
  right: 8px;
  font-size: 11px;
  opacity: 0.6;
  pointer-events: none;
`;

const TextContainer: React.FC<{ cutIndex: number; action?: Action; dialogue?: string; time?: number; timeSum?: number }> = ({
  cutIndex,
  action,
  dialogue,
  time,
  timeSum,
}) => {
  const { fps } = useProject();
  const { setDialogue, setActionText, setTime } = useProjectActions();
  // TIME はタイムコード文字列で編集し、確定時にフレーム数へ変換する
  const [timeDraft, setTimeDraft] = useState<string | null>(null);
  const timeCancelRef = useRef(false);

  const escKeyDown = (e: React.KeyboardEvent) => {
    const activeElement = document.activeElement as HTMLElement;
    e.key === 'Escape' && activeElement.blur();
  };

  const commitTime = () => {
    if (!timeCancelRef.current && timeDraft !== null) {
      const frames = parseTimecode(timeDraft, fps);
      if (frames !== null) setTime(cutIndex, frames);
    }
    timeCancelRef.current = false;
    setTimeDraft(null);
  };

  return (
    <>
      <View gridArea="action" width="100%" position="relative" height="auto">
        <MyTextArea
          className="hover"
          onKeyDown={escKeyDown}
          value={action?.text ?? ''}
          onChange={(e) => setActionText(cutIndex, e.target.value)}
        />
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
        <MyTextArea
          className="hover"
          onKeyDown={escKeyDown}
          value={dialogue ?? ''}
          onChange={(e) => setDialogue(cutIndex, e.target.value)}
        />
      </View>
      <View gridArea="time" width="100%" position="relative" height="auto">
        <MyTextArea
          className="hover"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.target as HTMLElement).blur();
            }
            if (e.key === 'Escape') {
              timeCancelRef.current = true;
            }
            escKeyDown(e);
          }}
          value={timeDraft ?? frameToTimecode(time || 0, fps)}
          onChange={(e) => setTimeDraft(e.target.value)}
          onBlur={commitTime}
        />
        <TimeSum>{frameToTimecode(timeSum || 0, fps)}</TimeSum>
      </View>
    </>
  );
};

const CutContainer: React.FC = () => {
  const cuts = usePsd();
  const isLoading = useGlobal('isLoading')[0];
  const { frame } = useProject();
  const thumbScale = thumbnailScale(frame);
  const frameThumbWidth = frame.width * thumbScale;
  const frameThumbHeight = frame.height * thumbScale;

  return (
    <>
      {isLoading && (
        <Flex direction="column" alignItems="center" justifyContent="center" height="100%">
          <ProgressCircle aria-label="Loading…" isIndeterminate size="L" />
          <Heading>Now Loading...</Heading>
        </Flex>
      )}
      {cuts.length > 0 &&
        cuts.map((cut, index) => {
          const timeSum = cuts.slice(0, index + 1).reduce((sum, i) => i.time && sum + i.time, 0);
          return (
            <View backgroundColor="gray-100" key={index}>
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
                              height: `${child.canvas && child.canvas.height * thumbScale}px`,
                              width: `${child.canvas && child.canvas.width * thumbScale}px`,
                              position: 'relative',
                              cursor: cut.psdName ? 'pointer' : 'default',
                            }}
                            key={`CC${index + 1}PP${child.name}`}
                            title={cut.psdName ? `${cut.psdName} をペイントアプリで開く` : undefined}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!cut.psdName) return;
                              if (window.api) {
                                window.api.openInPaint(cut.psdName).then((result) => {
                                  if (!result.ok) alert(`ペイントアプリを起動できませんでした: ${result.error ?? ''}`);
                                });
                              } else {
                                alert(
                                  `${cut.psdName} をローカルのペイントアプリで編集してください。\n保存後にプロジェクトを開き直すと反映されます。`,
                                );
                              }
                            }}
                          >
                            <div
                              style={{
                                height: `${child.canvas && child.canvas.height * thumbScale}px`,
                                width: `${child.canvas && child.canvas.width * thumbScale}px`,
                                position: 'relative',
                                background: '#FFF',
                              }}
                              id={`CC${index + 1}PP${child.name}`}
                            >
                              <img
                                style={{ transform: `scale(${thumbScale})`, transformOrigin: 'left top' }}
                                src={src}
                                alt="cut"
                              />
                            </div>
                            {cut.cameraWork && (
                              <>
                                <In
                                  style={{
                                    height: `${frameThumbHeight * cut.cameraWork.scale!.in}px`,
                                    width: `${frameThumbWidth * cut.cameraWork.scale!.in}px`,
                                    top: `${
                                      child.canvas &&
                                      (child.canvas.height * thumbScale -
                                        frameThumbHeight * (cut.cameraWork.scale!.in - cut.cameraWork.position!.in!.y!)) /
                                        2
                                    }px`,
                                    left: `${
                                      child.canvas &&
                                      (child.canvas.width * thumbScale -
                                        frameThumbWidth * (cut.cameraWork.scale!.in - cut.cameraWork.position!.in!.x!)) /
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
                                    height: `${frameThumbHeight * cut.cameraWork.scale!.out}px`,
                                    width: `${frameThumbWidth * cut.cameraWork.scale!.out}px`,
                                    top: `${
                                      child.canvas &&
                                      (child.canvas.height * thumbScale -
                                        frameThumbHeight * (cut.cameraWork.scale!.out - cut.cameraWork.position!.out!.y!)) /
                                        2
                                    }px`,
                                    left: `${
                                      child.canvas &&
                                      (child.canvas.width * thumbScale -
                                        frameThumbWidth * (cut.cameraWork.scale!.out - cut.cameraWork.position!.out!.x!)) /
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
                  <TextContainer
                    cutIndex={index}
                    action={cut?.action}
                    dialogue={cut?.dialogue}
                    time={cut?.time}
                    timeSum={timeSum}
                  />
                </Grid>
              </div>
            </View>
          );
        })}
      <AddCutRow />
    </>
  );
};

/** CUT 列最終行の＋ボタン。押すと PSD 雛形を自動生成して行を追加する */
const AddCutRow: React.FC = () => {
  const { addCut } = useProjectActions();
  const fileName = useGlobal('globalFileName')[0];
  const [adding, setAdding] = useState(false);
  if (!fileName) return null;
  const onAdd = async () => {
    setAdding(true);
    try {
      await addCut();
    } catch (err) {
      alert(err);
    } finally {
      setAdding(false);
    }
  };
  return (
    <View backgroundColor="gray-100">
      <Grid
        columns={['72px', '288px', 'auto', 'auto', '128px']}
        areas={['cut picture action dialogue time']}
        gap="size-200"
        marginBottom="size-25"
      >
        <View gridArea="cut" width="100%">
          <Flex direction="column" alignItems="center">
            <ActionButton isQuiet isDisabled={adding} onPress={onAdd} aria-label="Add Cut" marginY="size-100">
              <Add />
            </ActionButton>
          </Flex>
        </View>
      </Grid>
    </View>
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
