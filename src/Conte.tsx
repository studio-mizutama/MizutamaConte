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
import Layers from '@spectrum-icons/workflow/Layers';
import FolderAdd from '@spectrum-icons/workflow/FolderAdd';
import ChevronDown from '@spectrum-icons/workflow/ChevronDown';
import ChevronRight from '@spectrum-icons/workflow/ChevronRight';
import Close from '@spectrum-icons/workflow/Close';
import Link from '@spectrum-icons/workflow/Link';
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

const Gutter = styled.div`
  position: relative;
  height: 10px;
  margin: -5px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.12s ease;
  z-index: 4;
  &:hover {
    opacity: 1;
  }
`;

const RowInsert: React.FC<{
  cutIndex: number;
  busy: boolean;
  onInsert: () => void;
  canMergeNext: boolean;
  onMerge: () => void;
}> = ({ cutIndex, busy, onInsert, canMergeNext, onMerge }) => {
  const t = useT();
  return (
    <Gutter aria-label={t('conte.gutterAria', { n: cutIndex + 1 })}>
      <TooltipTrigger delay={300}>
        <ActionButton isQuiet isDisabled={busy} onPress={onInsert} aria-label={t('conte.insertLayerAria')}>
          <Layers />
        </ActionButton>
        <Tooltip>{t('conte.newLayer')}</Tooltip>
      </TooltipTrigger>
      {canMergeNext && (
        <TooltipTrigger delay={300}>
          <ActionButton isQuiet isDisabled={busy} onPress={onMerge} aria-label={t('conte.mergeAria', { n: cutIndex + 1 })}>
            <Link />
          </ActionButton>
          <Tooltip>{t('conte.merge')}</Tooltip>
        </TooltipTrigger>
      )}
    </Gutter>
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
  const splitLast = useCallback((i: number) => runBusy(() => actionsRef.current.splitCutLastLayer(i)), [runBusy]);
  const insertLayer = useCallback((i: number) => runBusy(() => actionsRef.current.addLayer(i)), [runBusy]);
  const mergeNext = useCallback((i: number) => runBusy(() => actionsRef.current.mergeCutWithNext(i)), [runBusy]);

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
                    onSplitLast={splitLast}
                    setDialogue={setDialogue}
                    setActionText={setActionText}
                    setTime={setTime}
                  />
                  <RowInsert
                    cutIndex={index}
                    busy={inserting}
                    onInsert={() => insertLayer(index)}
                    canMergeNext={index + 1 < project.cuts.length && canMerge(project.cuts[index], project.cuts[index + 1])}
                    onMerge={() => mergeNext(index)}
                  />
                </DraggableRow>
              )}
            </React.Fragment>
          );
        })}
      <AddCutRow />
    </>
  );
};

/** CUT 列最終行の追加コントロール。New CUT / New Layer ボタン + New Scene メニュー */
const AddCutRow: React.FC = () => {
  const t = useT();
  const { addCut, addLayer, addSceneCut } = useProjectActions();
  const { project } = useProject();
  const fileName = useGlobal('globalFileName')[0];
  const [busy, setBusy] = useState(false);
  if (!fileName) return null;
  const lastCutIndex = project.cuts.length - 1;
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
        <TooltipTrigger delay={300}>
          <ActionButton
            isQuiet
            isDisabled={busy || lastCutIndex < 0}
            onPress={() => run(() => addLayer(lastCutIndex))}
            aria-label={t('conte.newLayer')}
          >
            <Layers />
          </ActionButton>
          <Tooltip>{t('conte.newLayer')}</Tooltip>
        </TooltipTrigger>
        <TooltipTrigger delay={300}>
          <ActionButton isQuiet isDisabled={busy} onPress={() => run(addSceneCut)} aria-label={t('conte.newScene')}>
            <FolderAdd />
          </ActionButton>
          <Tooltip>{t('conte.newScene')}</Tooltip>
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
