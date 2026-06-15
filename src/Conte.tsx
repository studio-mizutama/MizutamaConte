import React, { useGlobal, useState, useRef, useCallback, useMemo } from 'reactn';
import {
  ActionButton,
  Grid,
  Heading,
  View,
  Flex,
  ProgressCircle,
  TextField,
  TooltipTrigger,
  Tooltip,
} from '@adobe/react-spectrum';
import styled from 'styled-components';
import Add from '@spectrum-icons/workflow/Add';
import ChevronDown from '@spectrum-icons/workflow/ChevronDown';
import ChevronRight from '@spectrum-icons/workflow/ChevronRight';
import Close from '@spectrum-icons/workflow/Close';
import FolderAdd from '@spectrum-icons/workflow/FolderAdd';
import { usePsd } from 'hooks/usePsd';
import { useProject } from 'hooks/useProject';
import { useProjectActions } from 'hooks/useProjectActions';
import { thumbnailScale } from 'project/dimensions';
import { deriveScenes, SceneGroup, canMerge } from 'project/scene';
import { useEditorMode } from 'hooks/editorMode';
import { useReorder } from 'hooks/useReorder';
import { useRowDnd, makeDragHandlers } from 'hooks/useRowDnd';
import { DraggableRow } from 'styles/DraggableRow';
import { CutRow } from 'CutRow';
import { useT } from 'i18n';

const Scroll = styled.div`
  height: calc(100vh - 82px);
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
`;

const Band = styled(DraggableRow)`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  margin-bottom: var(--spectrum-global-dimension-size-25);
  background: var(--spectrum-global-color-gray-200);
  border-radius: var(--spectrum-alias-border-radius-regular);
`;

/** CUT 間（および最終行下）のシーン区切り追加アフォーダンス。
 *  普段は薄い帯で、ホバー時にだけ FolderAdd アイコンと挿入線を浮かび上がらせる。 */
/* レイアウトに高さを足さないアンカー（CUT 間の余白を一切変えない）。
 * 当たり判定/表示は SceneGutterHit が境界線上に absolute で重なる。 */
const SceneGutterBar = styled.div`
  position: relative;
  height: 0;
  z-index: 2;
`;

/* CUT 境界をまたぐホバー当たり判定。行送りには影響しない（absolute・親は高さ0）。 */
const SceneGutterHit = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: -8px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.12s ease;

  &:hover {
    opacity: 1;
  }

  /* ホバー時に CUT 間へ入るシーン境界を示す挿入線 */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 2px;
    transform: translateY(-50%);
    border-radius: 2px;
    background: var(--spectrum-semantic-informative-color-border, #2680eb);
    pointer-events: none;
  }
`;

const SceneGutterIcon = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  color: var(--spectrum-global-color-gray-50, #fff);
  background: var(--spectrum-semantic-informative-color-border, #2680eb);

  svg {
    width: 14px;
    height: 14px;
  }
`;

/** CUT i の下のガター。クリックでシーン区切りを「下に追加」する。
 *  最終行(i+1 が無い)では addSceneCut（末尾に新シーンCUT）を呼ぶ。 */
const SceneGutter: React.FC<{ index: number; onAdd: (index: number) => void; label: string }> = ({
  index,
  onAdd,
  label,
}) => (
  <SceneGutterBar>
    <SceneGutterHit role="button" aria-label={label} onClick={() => onAdd(index)}>
      <SceneGutterIcon>
        <FolderAdd />
      </SceneGutterIcon>
    </SceneGutterHit>
  </SceneGutterBar>
);

const SceneBand: React.FC<{
  scene: SceneGroup;
  collapsed: boolean;
  onToggle: () => void;
  /** SCENE 帯をドラッグ可能にするか（reorder モードのとき true） */
  reorderScene?: boolean;
  /** テキスト編集（タイトル入力）可否。編集モード(edit)のときのみ true */
  editable?: boolean;
  dragging?: boolean;
  dropTarget?: boolean;
  onDragStartScene?: () => void;
  onDragOverScene?: () => void;
  onDropScene?: () => void;
  onDragEndScene?: () => void;
}> = ({
  scene,
  collapsed,
  onToggle,
  reorderScene = false,
  editable = false,
  dragging = false,
  dropTarget = false,
  onDragStartScene,
  onDragOverScene,
  onDropScene,
  onDragEndScene,
}) => {
  const t = useT();
  const { setSceneTitleAt, removeSceneStart } = useProjectActions();
  return (
    <Band
      id={`Scene${scene.sceneNumber}`}
      $dragging={dragging}
      $dropTarget={dropTarget}
      $cursor={reorderScene ? 'grab' : 'default'}
      {...makeDragHandlers({
        onStart: reorderScene ? onDragStartScene : undefined,
        onOver: reorderScene ? onDragOverScene : undefined,
        onDrop: reorderScene ? onDropScene : undefined,
        onEnd: reorderScene ? onDragEndScene : undefined,
      })}
    >
      <ActionButton isQuiet onPress={onToggle} aria-label={collapsed ? t('conte.scene.expand') : t('conte.scene.collapse')}>
        {collapsed ? <ChevronRight /> : <ChevronDown />}
      </ActionButton>
      <Heading level={4} margin={0}>{`SCENE ${scene.sceneNumber}`}</Heading>
      <TextField
        aria-label={t('conte.scene.titleAriaLabel', { n: scene.sceneNumber })}
        value={scene.title ?? ''}
        onChange={(v) => setSceneTitleAt(scene.startIndex, v)}
        placeholder={t('conte.scene.untitledPlaceholder')}
        width="size-3000"
        isQuiet
        // 編集モード以外では誤爆防止のため読み取り専用。
        // さらに pointer-events を切り、resize/reorder 中のホバー/クリック反応も抑える。
        isReadOnly={!editable}
        UNSAFE_style={{ pointerEvents: editable ? 'auto' : 'none' }}
      />
      {scene.startIndex > 0 && (
        <TooltipTrigger delay={300}>
          <ActionButton isQuiet onPress={() => removeSceneStart(scene.startIndex)} aria-label={t('conte.scene.removeBreak')}>
            <Close />
          </ActionButton>
          <Tooltip>{t('conte.scene.removeBreak')}</Tooltip>
        </TooltipTrigger>
      )}
    </Band>
  );
};

const CutContainer: React.FC = () => {
  const t = useT();
  const cuts = usePsd();
  const isLoading = useGlobal('isLoading')[0];
  const { project, frame, fps } = useProject();
  const actions = useProjectActions();
  // 最新の actions を ref 経由で参照し、コールバックの参照を安定させる（CutRow の memo を機能させる）
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const [editorMode] = useEditorMode();

  const scenes = deriveScenes(project.cuts);
  const sceneByStart = new Map(scenes.map((s) => [s.startIndex, s]));
  const sceneOfIndex = new Map<number, number>();
  scenes.forEach((s) => s.cutIndices.forEach((i) => sceneOfIndex.set(i, s.startIndex)));

  const { reorderCutAt, reorderSceneAt } = useReorder();
  const { dragIndex, dropIndex, dragKind, startDrag, setDropIndex, endDrag } = useRowDnd();

  // 並べ替えモードでは CUT 行・SCENE 帯の両方を draggable にし、
  // ドラッグ種別(dragKind)でドロップ可能域と並べ替え対象を切り替える。
  const isReorder = editorMode === 'reorder';
  const isDraggingCut = dragKind === 'cut';
  const isDraggingScene = dragKind === 'scene';

  // CUT 並べ替え: cut index 単位で from→to を確定して reorderCutAt
  const onCutDrop = useCallback(
    (to: number) => {
      const from = dragIndex;
      endDrag();
      if (from === null || from === to) return;
      // 防御ネット。現状どの経路も reject しない（moveItem はガード済で throw せず、applyReorderWith は失敗時に内部で notifyError 済）が、将来の rejection への安価な保険として残す
      reorderCutAt(from, to).catch((err) => alert(err));
    },
    [dragIndex, endDrag, reorderCutAt],
  );

  // SCENE 並べ替え: drop 先 cut index が属するシーンの番号(0始まり)へブロック移動
  const sceneOrderOfStart = useMemo(() => {
    const m = new Map<number, number>();
    scenes.forEach((s, order) => m.set(s.startIndex, order));
    return m;
  }, [scenes]);

  const onSceneDrop = useCallback(
    (toCutIndex: number) => {
      const fromStart = dragIndex;
      endDrag();
      if (fromStart === null) return;
      const fromScene = sceneOrderOfStart.get(fromStart);
      const toStart = sceneOfIndex.get(toCutIndex) ?? 0;
      const toScene = sceneOrderOfStart.get(toStart);
      if (fromScene === undefined || toScene === undefined || fromScene === toScene) return;
      // 防御ネット。現状どの経路も reject しない（moveItem はガード済で throw せず、applyReorderWith は失敗時に内部で notifyError 済）が、将来の rejection への安価な保険として残す
      reorderSceneAt(fromScene, toScene).catch((err) => alert(err));
    },
    [dragIndex, endDrag, sceneOrderOfStart, sceneOfIndex, reorderSceneAt],
  );

  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const toggleScene = (startIndex: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(startIndex) ? next.delete(startIndex) : next.add(startIndex);
      return next;
    });

  const [inserting, setInserting] = useState(false);
  const runBusy = useCallback(async (fn: () => Promise<void>) => {
    setInserting(true);
    try {
      await fn();
    } catch (err) {
      alert(err);
    } finally {
      setInserting(false);
    }
  }, []);

  const setDialogue = useCallback((i: number, v: string) => actionsRef.current.setDialogue(i, v), []);
  const setActionText = useCallback((i: number, v: string) => actionsRef.current.setActionText(i, v), []);
  const setTime = useCallback((i: number, v: number) => actionsRef.current.setTime(i, v), []);
  // per-cut クラスタのコールバック。actionsRef 経由で参照を安定させ CutRow の memo を維持する
  const splitLast = useCallback((i: number) => runBusy(() => actionsRef.current.splitCutLastLayer(i)), [runBusy]);
  const addLayerCb = useCallback((i: number) => runBusy(() => actionsRef.current.addLayer(i)), [runBusy]);
  const mergeNext = useCallback((i: number) => runBusy(() => actionsRef.current.mergeCutWithNext(i)), [runBusy]);
  const insertCutCb = useCallback((i: number) => runBusy(() => actionsRef.current.insertCut(i)), [runBusy]);
  const deleteCutCb = useCallback((i: number) => runBusy(() => actionsRef.current.deleteCut(i)), [runBusy]);
  // CUT i の下のガターから「下にシーン区切りを追加」する。
  // i+1 が存在すれば i+1 を新シーン開始にする（追加用途なので setSceneStartIfAbsent で既存時は no-op）。
  // 最終行(i+1 が無い)では末尾に新シーン CUT を追加する。
  const cutsLengthRef = useRef(project.cuts.length);
  cutsLengthRef.current = project.cuts.length;
  const addSceneBreakBelow = useCallback(
    (i: number) =>
      runBusy(async () => {
        // 最終行の下: 末尾に新シーン CUT を追加（「最終行の下にシーン区切り追加」を回復）
        if (i + 1 >= cutsLengthRef.current) {
          await actionsRef.current.addSceneCut();
          return;
        }
        // CUT 間: i+1 を新シーン開始にする。既に sceneStart なら何もしない（追加 UI なので解除はしない）
        actionsRef.current.setSceneStartIfAbsent(i + 1);
      }),
    [runBusy],
  );

  const thumbScale = thumbnailScale(frame);
  const frameThumbWidth = frame.width * thumbScale;
  const frameThumbHeight = frame.height * thumbScale;

  return (
    <>
      {isLoading && (
        <Flex direction="column" alignItems="center" justifyContent="center" height="100%">
          <ProgressCircle aria-label={t('common.loading.ariaLabel')} isIndeterminate size="L" />
          <Heading>{t('common.loading.heading')}</Heading>
        </Flex>
      )}
      {cuts.length > 0 &&
        cuts.map((cut, index) => {
          const band = sceneByStart.get(index);
          const sceneStart = sceneOfIndex.get(index) ?? 0;
          const isCollapsed = collapsed.has(sceneStart);
          const timeSum = cuts.slice(0, index + 1).reduce<number>((sum, c) => sum + (c.time ?? 0), 0);
          return (
            <React.Fragment key={index}>
              {band && (
                <SceneBand
                  scene={band}
                  collapsed={collapsed.has(band.startIndex)}
                  onToggle={() => toggleScene(band.startIndex)}
                  reorderScene={isReorder}
                  editable={editorMode === 'edit'}
                  dragging={isDraggingScene && dragIndex === band.startIndex}
                  // SCENE 帯のドロップ指示子は SCENE ドラッグ中のみ
                  dropTarget={isDraggingScene && dropIndex === band.startIndex}
                  onDragStartScene={() => startDrag('scene', band.startIndex)}
                  onDragOverScene={() => setDropIndex(band.startIndex)}
                  onDropScene={() => onSceneDrop(band.startIndex)}
                  onDragEndScene={endDrag}
                />
              )}
              {!isCollapsed && (
                <DraggableRow
                  $dragging={isDraggingCut && dragIndex === index}
                  // CUT ドラッグ中は CUT 行に、SCENE ドラッグ中も CUT 行をドロップ先にできる
                  $dropTarget={(isDraggingCut || isDraggingScene) && dropIndex === index}
                  {...makeDragHandlers({
                    onStart: isReorder ? () => startDrag('cut', index) : undefined,
                    // CUT 行は CUT/SCENE どちらのドラッグでもドロップ先になれる
                    onOver: isDraggingCut || isDraggingScene ? () => setDropIndex(index) : undefined,
                    onDrop: isDraggingCut
                      ? () => onCutDrop(index)
                      : isDraggingScene
                      ? () => onSceneDrop(index)
                      : undefined,
                    onEnd: isReorder ? endDrag : undefined,
                  })}
                >
                  <CutRow
                    index={index}
                    cut={cut}
                    projectCut={project.cuts[index]}
                    frame={frame}
                    thumbScale={thumbScale}
                    frameThumbWidth={frameThumbWidth}
                    frameThumbHeight={frameThumbHeight}
                    editorMode={editorMode}
                    inserting={inserting}
                    timeSum={timeSum}
                    fps={fps}
                    canMergeNext={
                      index + 1 < project.cuts.length && canMerge(project.cuts[index], project.cuts[index + 1])
                    }
                    canDelete={project.cuts.length > 1}
                    onSplitLast={splitLast}
                    onInsertCut={insertCutCb}
                    onAddLayer={addLayerCb}
                    onDeleteCut={deleteCutCb}
                    onMergeNext={mergeNext}
                    setDialogue={setDialogue}
                    setActionText={setActionText}
                    setTime={setTime}
                  />
                </DraggableRow>
              )}
              {/* CUT 間のシーン区切りガター。次CUTが既にシーン開始（SceneBand 表示済み）の位置では出さない。
                  最終行の下では addSceneCut で末尾に新シーンを追加する。並べ替え中は誤爆防止のため非表示。 */}
              {!isCollapsed && !isReorder && !sceneByStart.has(index + 1) && (
                <SceneGutter index={index} onAdd={addSceneBreakBelow} label={t('cutRow.sceneBreakAria', { n: index + 1 })} />
              )}
            </React.Fragment>
          );
        })}
      <AddCutRow />
    </>
  );
};

/** 空プロジェクトの起点ボタン。CUT が 0 個のときだけ「最初の CUT を追加」を出す。
 *  CUT が 1 個以上あるときは per-cut クラスタで挿入/レイヤー/シーンを操作するため非表示。 */
const AddCutRow: React.FC = () => {
  const t = useT();
  const { addCut } = useProjectActions();
  const { project } = useProject();
  const fileName = useGlobal('globalFileName')[0];
  const [busy, setBusy] = useState(false);
  if (!fileName) return null;
  // CUT が 1 個でもあれば per-cut クラスタに任せるのでグローバルボタンは出さない
  if (project.cuts.length > 0) return null;
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      alert(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View backgroundColor="gray-100" paddingX="size-200" paddingY="size-100">
      <Flex direction="row" alignItems="center" gap="size-100">
        <TooltipTrigger delay={300}>
          <ActionButton isQuiet isDisabled={busy} onPress={() => run(addCut)} aria-label={t('conte.newCut')}>
            <Add />
          </ActionButton>
          <Tooltip>{t('conte.newCut')}</Tooltip>
        </TooltipTrigger>
      </Flex>
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
