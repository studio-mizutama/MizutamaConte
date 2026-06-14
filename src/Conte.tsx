import React, { useGlobal, useState, useRef, useCallback } from 'reactn';
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
import { useTool } from 'hooks/useTool';
import { CutRow } from 'CutRow';

const Scroll = styled.div`
  height: calc(100vh - 82px);
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
`;

const Band = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  margin-bottom: var(--spectrum-global-dimension-size-25);
  background: var(--spectrum-global-color-gray-200);
  border-radius: var(--spectrum-alias-border-radius-regular);
`;

const SceneBand: React.FC<{ scene: SceneGroup; collapsed: boolean; onToggle: () => void }> = ({
  scene,
  collapsed,
  onToggle,
}) => {
  const { setSceneTitleAt, removeSceneStart } = useProjectActions();
  const tool = useTool();
  const editable = tool === 'Text';
  return (
    <Band id={`Scene${scene.sceneNumber}`}>
      <ActionButton isQuiet onPress={onToggle} aria-label={collapsed ? 'Expand scene' : 'Collapse scene'}>
        {collapsed ? <ChevronRight /> : <ChevronDown />}
      </ActionButton>
      <Heading level={4} margin={0}>{`SCENE ${scene.sceneNumber}`}</Heading>
      <TextField
        aria-label={`Scene ${scene.sceneNumber} title`}
        value={scene.title ?? ''}
        onChange={(v) => setSceneTitleAt(scene.startIndex, v)}
        placeholder="（無題シーン）"
        width="size-3000"
        isQuiet
        isReadOnly={!editable}
      />
      {scene.startIndex > 0 && (
        <TooltipTrigger delay={300}>
          <ActionButton isQuiet onPress={() => removeSceneStart(scene.startIndex)} aria-label="Remove scene break">
            <Close />
          </ActionButton>
          <Tooltip>シーン区切りを解除</Tooltip>
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
}> = ({ cutIndex, busy, onInsert, canMergeNext, onMerge }) => (
  <Gutter aria-label={`Insert layer into cut ${cutIndex + 1}`}>
    <TooltipTrigger delay={300}>
      <ActionButton isQuiet isDisabled={busy} onPress={onInsert} aria-label="Insert New Layer">
        <Layers />
      </ActionButton>
      <Tooltip>New Layer</Tooltip>
    </TooltipTrigger>
    {canMergeNext && (
      <TooltipTrigger delay={300}>
        <ActionButton isQuiet isDisabled={busy} onPress={onMerge} aria-label={`Merge cut ${cutIndex + 1} with next`}>
          <Link />
        </ActionButton>
        <Tooltip>上下のCUTを結合</Tooltip>
      </TooltipTrigger>
    )}
  </Gutter>
);

const CutContainer: React.FC = () => {
  const cuts = usePsd();
  const isLoading = useGlobal('isLoading')[0];
  const { project, frame, fps } = useProject();
  const actions = useProjectActions();
  // 最新の actions を ref 経由で参照し、コールバックの参照を安定させる（CutRow の memo を機能させる）
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const tool = useTool();

  const scenes = deriveScenes(project.cuts);
  const sceneByStart = new Map(scenes.map((s) => [s.startIndex, s]));
  const sceneOfIndex = new Map<number, number>();
  scenes.forEach((s) => s.cutIndices.forEach((i) => sceneOfIndex.set(i, s.startIndex)));

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
          <ProgressCircle aria-label="Loading…" isIndeterminate size="L" />
          <Heading>Now Loading...</Heading>
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
                />
              )}
              {!isCollapsed && (
                <CutRow
                  index={index}
                  cut={cut}
                  projectCut={project.cuts[index]}
                  frame={frame}
                  thumbScale={thumbScale}
                  frameThumbWidth={frameThumbWidth}
                  frameThumbHeight={frameThumbHeight}
                  tool={tool}
                  inserting={inserting}
                  timeSum={timeSum}
                  fps={fps}
                  onSplitLast={splitLast}
                  setDialogue={setDialogue}
                  setActionText={setActionText}
                  setTime={setTime}
                />
              )}
              {!isCollapsed && (
                <RowInsert
                  cutIndex={index}
                  busy={inserting}
                  onInsert={() => insertLayer(index)}
                  canMergeNext={index + 1 < project.cuts.length && canMerge(project.cuts[index], project.cuts[index + 1])}
                  onMerge={() => mergeNext(index)}
                />
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
          <ActionButton isQuiet isDisabled={busy} onPress={() => run(addCut)} aria-label="New CUT">
            <Add />
          </ActionButton>
          <Tooltip>New CUT</Tooltip>
        </TooltipTrigger>
        <TooltipTrigger delay={300}>
          <ActionButton
            isQuiet
            isDisabled={busy || lastCutIndex < 0}
            onPress={() => run(() => addLayer(lastCutIndex))}
            aria-label="New Layer"
          >
            <Layers />
          </ActionButton>
          <Tooltip>New Layer</Tooltip>
        </TooltipTrigger>
        <TooltipTrigger delay={300}>
          <ActionButton isQuiet isDisabled={busy} onPress={() => run(addSceneCut)} aria-label="New Scene">
            <FolderAdd />
          </ActionButton>
          <Tooltip>New Scene</Tooltip>
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
