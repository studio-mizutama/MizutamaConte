import React, { useState, useRef } from 'react';
import {
  ActionButton,
  Button,
  ButtonGroup,
  Content,
  Dialog,
  DialogContainer,
  Grid,
  Heading,
  View,
  Flex,
  TooltipTrigger,
  Tooltip,
} from '@adobe/react-spectrum';
import styled from 'styled-components';
import { Psd, Layer } from 'ag-psd';
import RemoveCircle from '@spectrum-icons/workflow/RemoveCircle';
import Layers from '@spectrum-icons/workflow/Layers';
import Delete from '@spectrum-icons/workflow/Delete';
import Link from '@spectrum-icons/workflow/Link';
import { cutCanvas } from 'project/scene';
import { applyShiftSnap } from 'project/camera';
import { ProjectCut, FrameSize } from 'project/types';
import { EditorMode } from 'hooks/editorMode';
import { useEditingEnabled } from 'hooks/editingEnabled';
import { useProjectActions } from 'hooks/useProjectActions';
import { canvasToDataURL } from 'psd/thumbnail';
import { frameToTimecode, parseTimecode } from 'project/time';
import { useT, TranslationKey } from 'i18n';

const MyTextArea = styled.textarea<{ $editable: boolean }>`
  position: absolute;
  top: 2px;
  height: calc(100% - 4px);
  width: calc(100% - 4px);
  resize: none;
  background: none;
  margin: 0;
  padding: 0;
  border: none;
  /* 非編集モード（resize/reorder）では完全に不活性化し、ホバー/クリック/フォーカスの
     誤爆（青枠 outline）を防ぐ。クリックは背後の行へ抜ける。 */
  pointer-events: ${(p) => (p.$editable ? 'auto' : 'none')};
  cursor: ${(p) => (p.$editable ? 'text' : 'default')};

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

/** CUT 列下端の per-cut 操作アイコンクラスタ。CUT 列は 72px と狭いので 2 列グリッドに収める。
 *  4 つ（レイヤー追加・削除・結合・分離）を 2×2 に並べる（＋挿入は行間ホバーガターへ移設）。
 *  margin-top:auto で列の下端へ押し下げる（CUT 番号は上端・クラスタは下端）。
 *  通常はうっすら表示し、CUT 行(.hover)ホバー時に不透明にして誤クリックを防ぐ。 */
const CutActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, auto);
  justify-content: center;
  gap: var(--spectrum-global-dimension-size-50, 4px);
  margin-top: auto;
  max-width: 72px;
  opacity: 0.25;
  transition: opacity 0.12s ease;
  /* CUT 行（祖先の div.hover）をホバーしたときに表示 */
  .hover:hover & {
    opacity: 1;
  }
`;

/** トランジションのインライン表示（効果名＋duration）。PICTURE と ACTION の間に小さく置く。 */
const TransitionLabel = styled.div`
  position: absolute;
  left: calc((100% - 96px) / 2 + 100px);
  font-size: 11px;
  opacity: 0.7;
  pointer-events: none;
  white-space: nowrap;
`;

/** フェード種別（保存値）→ i18n キーの対応。表示名のみ翻訳し、保存値は英語固定。 */
const fadeLabelKey = (fade: NonNullable<Action['fadeIn']> | NonNullable<Action['fadeOut']>): TranslationKey => {
  switch (fade) {
    case 'White In':
      return 'transition.fade.whiteIn';
    case 'Black In':
      return 'transition.fade.blackIn';
    case 'White Out':
      return 'transition.fade.whiteOut';
    case 'Black Out':
      return 'transition.fade.blackOut';
    case 'Cross':
      return 'transition.fade.cross';
    default:
      return 'transition.fade.none';
  }
};

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

/** TIME/ACTION/DIALOGUE のテキスト編集列。project を購読せず props のハンドラで更新する（memo 化のため）。
 *  editable が false（resize/reorder モード）のときは読み取り専用にして誤爆を防ぐ。 */
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
  const t = useT();
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
          $editable={editable}
          tabIndex={editable ? undefined : -1}
          readOnly={!editable}
          onKeyDown={escKeyDown}
          value={action?.text ?? ''}
          onChange={(e) => setActionText(cutIndex, e.target.value)}
        />
        {/* IN 側トランジション: 種別によらず上向き三角（Fade）。尺・種別はテキストラベルで示す */}
        {action?.fadeIn && (
          <Fade viewBox="0 0 96 48" width="96px">
            <path d="M48,2.83,91.17,46H4.83L48,2.83M48,0,0,48H96L48,0Z" />
          </Fade>
        )}
        {action?.fadeIn && (
          <TransitionLabel style={{ top: '2px' }}>
            {`${t(fadeLabelKey(action.fadeIn))} ${Math.round(action.fadeInDuration ?? 0)}`}
          </TransitionLabel>
        )}
        {/* OUT 側トランジション: 種別によらず下向き三角（Fade）。尺・種別はテキストラベルで示す */}
        {action?.fadeOut && (
          <Fade viewBox="0 0 96 48" width="96px" style={{ bottom: 0 }}>
            <path d="M91.17,2,48,45.17,4.83,2H91.17M96,0Zm0,0H0L48,48,96,0Z" />
          </Fade>
        )}
        {action?.fadeOut && (
          <TransitionLabel style={{ bottom: '2px' }}>
            {`${t(fadeLabelKey(action.fadeOut))} ${Math.round(action.fadeOutDuration ?? 0)}`}
          </TransitionLabel>
        )}
      </View>
      <View gridArea="dialogue" width="100%" position="relative" height="auto">
        <MyTextArea
          className="hover"
          $editable={editable}
          tabIndex={editable ? undefined : -1}
          readOnly={!editable}
          onKeyDown={escKeyDown}
          value={dialogue ?? ''}
          onChange={(e) => setDialogue(cutIndex, e.target.value)}
        />
      </View>
      <View gridArea="time" width="100%" position="relative" height="auto">
        <MyTextArea
          className="hover"
          $editable={editable}
          tabIndex={editable ? undefined : -1}
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
  const t = useT();
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
      // Shift: 横のみ / 縦のみ / アスペクト比保持(斜め) の最近傍にスナップ
      const { dw, dh } = applyShiftSnap(rawDw, rawDh, ev.shiftKey, base.width / base.height);
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
      <Handle onMouseDown={onMouseDown} aria-label={t('cutRow.resizeAria', { n: cutIndex + 1 })} />
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
  editorMode: EditorMode;
  inserting: boolean;
  timeSum?: number;
  fps: number;
  /** この CUT の下に次の CUT を結合できるか（隣接 CUT が存在し canMerge を満たすとき真） */
  canMergeNext: boolean;
  /** この CUT を削除できるか（CUT が複数あるとき真。最後の1CUTは残す） */
  canDelete: boolean;
  onSplitLast: (index: number) => void;
  /** この CUT にレイヤーを追加 */
  onAddLayer: (index: number) => void;
  /** この CUT を削除 */
  onDeleteCut: (index: number) => void;
  /** この CUT を下の CUT と結合 */
  onMergeNext: (index: number) => void;
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
    editorMode,
    inserting,
    timeSum,
    fps,
    canMergeNext,
    canDelete,
    onSplitLast,
    onAddLayer,
    onDeleteCut,
    onMergeNext,
    setDialogue,
    setActionText,
    setTime,
  }) => {
    const t = useT();
    // 編集操作が可能か（プロジェクト未オープン or edit 以外のモードでは 4 アイコンをロック）
    const editingEnabled = useEditingEnabled();
    // 削除確認ダイアログの開閉。確認時のみ onDeleteCut を呼ぶ（誤削除防止）
    const [confirmDelete, setConfirmDelete] = useState(false);
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
            <View gridArea="cut" width="100%" height="100%">
              {/* CUT 番号は上端・アイコンクラスタは下端（CutActions の margin-top:auto で押し下げ） */}
              <Flex direction="column" alignItems="center" gap="size-50" height="100%">
                <Heading>{('00' + (index + 1)).slice(-3)}</Heading>
                {/* per-cut 操作クラスタ。72px に収めるため 2 列グリッドに 4 つを 2×2 で並べる
                    （＋の CUT 挿入は行間ホバーガターへ移設）。
                    使えないアイコンは消さず isDisabled でグレーアウトし、配置を固定する */}
                <CutActions>
                  {/* レイヤー追加 */}
                  <TooltipTrigger delay={300}>
                    <ActionButton
                      isQuiet
                      isDisabled={inserting || !editingEnabled}
                      onPress={() => onAddLayer(index)}
                      aria-label={t('cutRow.addLayerAria', { n: index + 1 })}
                    >
                      <Layers />
                    </ActionButton>
                    <Tooltip>{t('cutRow.addLayerTooltip')}</Tooltip>
                  </TooltipTrigger>
                  {/* CUT 削除（最後の1CUTは残す＝canDelete でグレーアウト・配置固定）。確認ダイアログを挟む */}
                  <TooltipTrigger delay={300}>
                    <ActionButton
                      isQuiet
                      isDisabled={inserting || !canDelete || !editingEnabled}
                      onPress={() => setConfirmDelete(true)}
                      aria-label={t('cutRow.deleteAria', { n: index + 1 })}
                    >
                      <Delete />
                    </ActionButton>
                    <Tooltip>{t('cutRow.deleteTooltip')}</Tooltip>
                  </TooltipTrigger>
                  {/* 下と結合（隣接 CUT が結合可能なときだけ有効・配置固定でグレーアウト） */}
                  <TooltipTrigger delay={300}>
                    <ActionButton
                      isQuiet
                      isDisabled={inserting || !canMergeNext || !editingEnabled}
                      onPress={() => onMergeNext(index)}
                      aria-label={t('cutRow.mergeAria', { n: index + 1 })}
                    >
                      <Link />
                    </ActionButton>
                    <Tooltip>{t('cutRow.mergeTooltip')}</Tooltip>
                  </TooltipTrigger>
                  {/* 分離（複数レイヤーのとき最終レイヤーを別 CUT に切り出す・配置固定でグレーアウト） */}
                  <TooltipTrigger delay={300}>
                    <ActionButton
                      isQuiet
                      isDisabled={inserting || projectCut.rows.length <= 1 || !editingEnabled}
                      onPress={() => onSplitLast(index)}
                      aria-label={t('cutRow.splitAria', { n: index + 1 })}
                    >
                      <RemoveCircle />
                    </ActionButton>
                    <Tooltip>{t('cutRow.splitTooltip')}</Tooltip>
                  </TooltipTrigger>
                </CutActions>
              </Flex>
              {/* CUT 削除の確認ダイアログ。確認時のみ onDeleteCut を呼ぶ */}
              <DialogContainer onDismiss={() => setConfirmDelete(false)}>
                {confirmDelete && (
                  <Dialog>
                    <Heading>{t('cutRow.deleteConfirm.title')}</Heading>
                    <Content>{t('cutRow.deleteConfirm.body', { n: index + 1 })}</Content>
                    <ButtonGroup>
                      <Button variant="secondary" onPress={() => setConfirmDelete(false)}>
                        {t('cutRow.deleteConfirm.cancel')}
                      </Button>
                      <Button
                        variant="negative"
                        autoFocus
                        onPress={() => {
                          setConfirmDelete(false);
                          onDeleteCut(index);
                        }}
                      >
                        {t('cutRow.deleteConfirm.confirm')}
                      </Button>
                    </ButtonGroup>
                  </Dialog>
                )}
              </DialogContainer>
            </View>
            <View gridArea="picture" width="100%" height="auto">
              <div style={{ position: 'relative', width: `${cutCanvas(projectCut).width * thumbScale}px` }}>
                {editorMode === 'resize' && cut.psdName && (
                  <ResizeHandle cutIndex={index} canvas={cutCanvas(projectCut)} frame={frame} thumbScale={thumbScale} />
                )}
                {cut.picture?.children
                  ?.filter((child: Psd['children'], layerindex: number) => layerindex !== 0)
                  .map((child: Layer, layerI: number, layerArr: Layer[]) => {
                    const src = canvasToDataURL(child.canvas);
                    return (
                      <div
                        style={{
                          height: `${child.canvas && child.canvas.height * thumbScale}px`,
                          width: `${child.canvas && child.canvas.width * thumbScale}px`,
                          position: 'relative',
                          cursor: editorMode === 'resize' ? 'crosshair' : cut.psdName ? 'pointer' : 'default',
                        }}
                        key={`CC${index + 1}PP${child.name}`}
                        title={cut.psdName ? t('cutRow.openHint', { name: cut.psdName }) : undefined}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          if (!cut.psdName) return;
                          if (window.api) {
                            window.api.openInPaint(cut.psdName).then((result) => {
                              if (!result.ok) alert(t('cutRow.launchFailed', { error: result.error ?? '' }));
                            });
                          } else {
                            alert(t('cutRow.webEditHint', { name: cut.psdName }));
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
                        {cut.cameraWork && layerI === 0 && (
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
                        )}
                        {cut.cameraWork && layerI === layerArr.length - 1 && (
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
              // 編集モードのときだけテキスト編集可（resize/reorder では誤爆防止のため読み取り専用）
              editable={editorMode === 'edit'}
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
