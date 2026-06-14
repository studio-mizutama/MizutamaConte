import React, { useState, useRef } from 'react';
import { ActionButton, Grid, Heading, View, Flex, TooltipTrigger, Tooltip } from '@adobe/react-spectrum';
import styled from 'styled-components';
import { Psd, Layer } from 'ag-psd';
import RemoveCircle from '@spectrum-icons/workflow/RemoveCircle';
import { cutCanvas } from 'project/scene';
import { applyShiftSnap } from 'project/camera';
import { ProjectCut, FrameSize } from 'project/types';
import { ToolName } from 'hooks/useTool';
import { useProjectActions } from 'hooks/useProjectActions';
import { canvasToDataURL } from 'psd/thumbnail';
import { frameToTimecode, parseTimecode } from 'project/time';

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

  &[readonly] {
    cursor: default;
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

const Handle = styled.div`
  position: absolute;
  right: -6px;
  bottom: -6px;
  width: 14px;
  height: 14px;
  border: 2px solid var(--spectrum-semantic-informative-color-border, #2680eb);
  background: var(--spectrum-global-color-gray-50, #fff);
  border-radius: 2px;
  cursor: nwse-resize;
  z-index: 5;
`;

const ResizeOutline = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  border: 2px dashed var(--spectrum-semantic-informative-color-border, #2680eb);
  pointer-events: none;
  z-index: 6;
`;

/** TIME/ACTION/DIALOGUE のテキスト編集列。project を購読せず props のハンドラで更新する（memo 化のため）。 */
const TextContainer: React.FC<{
  cutIndex: number;
  action?: Action;
  dialogue?: string;
  time?: number;
  timeSum?: number;
  fps: number;
  editable: boolean;
  setDialogue: (index: number, value: string) => void;
  setActionText: (index: number, value: string) => void;
  setTime: (index: number, value: number) => void;
}> = React.memo(({ cutIndex, action, dialogue, time, timeSum, fps, editable, setDialogue, setActionText, setTime }) => {
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
          className={editable ? 'hover' : undefined}
          readOnly={!editable}
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
          className={editable ? 'hover' : undefined}
          readOnly={!editable}
          onKeyDown={escKeyDown}
          value={dialogue ?? ''}
          onChange={(e) => setDialogue(cutIndex, e.target.value)}
        />
      </View>
      <View gridArea="time" width="100%" position="relative" height="auto">
        <MyTextArea
          className={editable ? 'hover' : undefined}
          readOnly={!editable}
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
});

TextContainer.displayName = 'TextContainer';

/** Crop モードでカットのキャンバスを右下ドラッグでリサイズするハンドル。
 *  最小はフレーム(ネイティブ解像度)。絵コンテのフレームは必ず作画内に収まる必要があるため
 *  キャンバスをフレームより小さくはできない。 */
const ResizeHandle: React.FC<{ cutIndex: number; canvas: FrameSize; frame: FrameSize; thumbScale: number }> = ({
  cutIndex,
  canvas,
  frame,
  thumbScale,
}) => {
  const { resizeCanvas } = useProjectActions();
  const [preview, setPreview] = useState<FrameSize | null>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const base = { ...canvas };
    let latest = { ...canvas };

    const onMove = (ev: MouseEvent) => {
      // 右下ハンドル: 右へドラッグ(dx>0)で幅増、下へドラッグ(dy>0)で高さ増
      const rawDw = (ev.clientX - startX) / thumbScale;
      const rawDh = (ev.clientY - startY) / thumbScale;
      const { dw, dh } = applyShiftSnap(rawDw, rawDh, ev.shiftKey);
      latest = {
        width: Math.max(frame.width, Math.round(base.width + dw)),
        height: Math.max(frame.height, Math.round(base.height + dh)),
      };
      setPreview(latest);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setPreview(null);
      if (latest.width !== base.width || latest.height !== base.height) {
        resizeCanvas(cutIndex, latest).catch((err) => alert(err));
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <>
      {preview && (
        <ResizeOutline style={{ width: `${preview.width * thumbScale}px`, height: `${preview.height * thumbScale}px` }} />
      )}
      <Handle onMouseDown={onMouseDown} aria-label={`Resize cut ${cutIndex + 1}`} />
    </>
  );
};

export interface CutRowProps {
  index: number;
  cut: Cut;
  projectCut: ProjectCut;
  frame: FrameSize;
  thumbScale: number;
  frameThumbWidth: number;
  frameThumbHeight: number;
  tool: ToolName;
  inserting: boolean;
  timeSum?: number;
  fps: number;
  onSplitLast: (index: number) => void;
  setDialogue: (index: number, value: string) => void;
  setActionText: (index: number, value: string) => void;
  setTime: (index: number, value: number) => void;
}

/** 1カット行。project を購読せず props のみで描画する（React.memo を機能させる）。 */
export const CutRow: React.FC<CutRowProps> = React.memo(
  ({
    index,
    cut,
    projectCut,
    frame,
    thumbScale,
    frameThumbWidth,
    frameThumbHeight,
    tool,
    inserting,
    timeSum,
    fps,
    onSplitLast,
    setDialogue,
    setActionText,
    setTime,
  }) => {
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
              <Flex direction="column" alignItems="center" gap="size-50">
                <Heading>{('00' + (index + 1)).slice(-3)}</Heading>
                {projectCut.rows.length > 1 ? (
                  <TooltipTrigger delay={300}>
                    <ActionButton
                      isQuiet
                      isDisabled={inserting}
                      onPress={() => onSplitLast(index)}
                      aria-label={`Split last layer of cut ${index + 1}`}
                    >
                      <RemoveCircle />
                    </ActionButton>
                    <Tooltip>最終レイヤーを別CUTに分離</Tooltip>
                  </TooltipTrigger>
                ) : (
                  <></>
                )}
              </Flex>
            </View>
            <View gridArea="picture" width="100%" height="auto">
              <div style={{ position: 'relative', width: `${cutCanvas(projectCut).width * thumbScale}px` }}>
                {tool === 'Crop' && cut.psdName && (
                  <ResizeHandle cutIndex={index} canvas={cutCanvas(projectCut)} frame={frame} thumbScale={thumbScale} />
                )}
                {cut.picture?.children
                  ?.filter((child: Psd['children'], layerindex: number) => layerindex !== 0)
                  .map((child: Layer) => {
                    const src = canvasToDataURL(child.canvas);
                    return (
                      <div
                        style={{
                          height: `${child.canvas && child.canvas.height * thumbScale}px`,
                          width: `${child.canvas && child.canvas.width * thumbScale}px`,
                          position: 'relative',
                          cursor: tool === 'Crop' ? 'crosshair' : cut.psdName ? 'pointer' : 'default',
                        }}
                        key={`CC${index + 1}PP${child.name}`}
                        title={cut.psdName ? `${cut.psdName} をダブルクリックでペイントアプリで開く` : undefined}
                        onDoubleClick={(e) => {
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
              </div>
            </View>
            <TextContainer
              cutIndex={index}
              action={cut?.action}
              dialogue={cut?.dialogue}
              time={cut?.time}
              timeSum={timeSum}
              fps={fps}
              editable={tool === 'Text'}
              setDialogue={setDialogue}
              setActionText={setActionText}
              setTime={setTime}
            />
          </Grid>
        </div>
      </View>
    );
  },
);
CutRow.displayName = 'CutRow';
