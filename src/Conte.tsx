import React, { useGlobal, useState, useRef, useCallback, useMemo } from 'reactn';
import {
  ActionButton,
  Grid,
  Heading,
  View,
  Flex,
  ProgressCircle,
  Text,
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
import { useOpenFolder } from 'hooks/useOpenFolder';
import { DraggableRow } from 'styles/DraggableRow';
import { CutRow } from 'CutRow';
import { useT } from 'i18n';

const { api } = window;

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

/** 空状態のフォルダ D&D ドロップゾーン。ドラッグ中は accent 色でハイライトする。
 *  $active=true でアクセントの枠線 + 薄いアクセント背景に切り替える。 */
const DropZone = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 280px;
  padding: 20px 24px;
  margin-top: 8px;
  border-radius: var(--spectrum-alias-border-radius-regular, 4px);
  border: 2px dashed
    ${(p) =>
      p.$active
        ? 'var(--spectrum-semantic-informative-color-border, #2680eb)'
        : 'var(--spectrum-global-color-gray-400, #b3b3b3)'};
  /* アクセント色そのものではなく薄い tint を敷く（ラベルが読める濃度に抑える） */
  background: ${(p) => (p.$active ? 'rgba(38, 128, 235, 0.12)' : 'transparent')};
  color: var(--spectrum-alias-text-color);
  font-size: 13px;
  text-align: center;
  transition: border-color 0.12s ease, background 0.12s ease, color 0.12s ease;
`;

/** CUT 間（および最終行下）の行間ガター。CUT 追加(＋)とシーン区切り追加(📁+)を兼ねる。
 *  普段は薄く、ホバー時にだけアイコンと挿入線を浮かび上がらせる。 */
/* レイアウトに高さを足さないアンカー（CUT 間の余白を一切変えない）。
 * 当たり判定/表示は InterRowGutterHit が境界線上に absolute で重なる。 */
const InterRowGutterBar = styled.div`
  position: relative;
  height: 0;
  z-index: 2;
`;

/* CUT 境界をまたぐホバー当たり判定。行送りには影響しない（absolute・親は高さ0）。
 * ボタンを横並びに中央寄せで重ねる。 */
const InterRowGutterHit = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: -8px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.12s ease;

  &:hover {
    opacity: 1;
  }

  /* ホバー時に CUT 間へ入る挿入線 */
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

/* 円形アイコンボタン。挿入線の上に z-index で重ねる。 */
const GutterIconButton = styled.button`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: var(--spectrum-global-color-gray-50, #fff);
  background: var(--spectrum-semantic-informative-color-border, #2680eb);

  svg {
    width: 14px;
    height: 14px;
  }
`;

/** CUT i の下の行間ガター。
 *  ＋: 直下に CUT を挿入（常時表示）。最終行下では末尾に CUT 追加。
 *  📁+: 直下にシーン区切りを追加（次CUTがまだシーン開始でないときだけ表示）。 */
const InterRowGutter: React.FC<{
  index: number;
  onAddCut: (index: number) => void;
  onAddScene: (index: number) => void;
  showScene: boolean;
  cutLabel: string;
  cutTooltip: string;
  sceneLabel: string;
  sceneTooltip: string;
}> = ({ index, onAddCut, onAddScene, showScene, cutLabel, cutTooltip, sceneLabel, sceneTooltip }) => (
  <InterRowGutterBar>
    <InterRowGutterHit>
      {/* CUT 追加（常時）。custom overlay ボタンなのでネイティブ title でホバー説明を出す */}
      <GutterIconButton type="button" aria-label={cutLabel} title={cutTooltip} onClick={() => onAddCut(index)}>
        <Add />
      </GutterIconButton>
      {/* シーン区切り追加（次CUTがまだシーン開始でないときだけ） */}
      {showScene && (
        <GutterIconButton type="button" aria-label={sceneLabel} title={sceneTooltip} onClick={() => onAddScene(index)}>
          <FolderAdd />
        </GutterIconButton>
      )}
    </InterRowGutterHit>
  </InterRowGutterBar>
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
                    onAddLayer={addLayerCb}
                    onDeleteCut={deleteCutCb}
                    onMergeNext={mergeNext}
                    setDialogue={setDialogue}
                    setActionText={setActionText}
                    setTime={setTime}
                  />
                </DraggableRow>
              )}
              {/* CUT 間の行間ガター。＋=直下に CUT 挿入（常時）、📁+=シーン区切り追加。
                  最終行の下では ＋ が末尾に CUT 追加、📁+ が末尾に新シーンを追加する。
                  📁+ は次CUTが既にシーン開始（SceneBand 表示済み）の位置では出さない。
                  編集モード(edit)のときだけ表示し、リサイズ/並べ替え中は誤爆防止のため非表示。 */}
              {!isCollapsed && editorMode === 'edit' && (
                <InterRowGutter
                  index={index}
                  onAddCut={insertCutCb}
                  onAddScene={addSceneBreakBelow}
                  showScene={!sceneByStart.has(index + 1)}
                  cutLabel={t('cutRow.insertAria', { n: index + 1 })}
                  cutTooltip={t('cutRow.insertTooltip')}
                  sceneLabel={t('cutRow.sceneBreakAria', { n: index + 1 })}
                  sceneTooltip={t('cutRow.sceneBreakTooltip')}
                />
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

/** プロジェクト未オープン時の中央寄せ空状態ガイド + フォルダ D&D ドロップゾーン。
 *  ドロップで Open と同一経路（useOpenFolder）でフォルダを開く＝履歴クリアも共通。 */
const EmptyState: React.FC = () => {
  const t = useT();
  const { openFolderFromPath, openFolderFromHandle } = useOpenFolder();
  const setLoadError = useGlobal('loadError')[1];
  const [isDragging, setIsDragging] = useState(false);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragging) setIsDragging(true);
  };

  // 子要素への移動で発火する dragleave のちらつきを避けるため、ドロップゾーン外へ出たときだけ解除する
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    void (async () => {
      try {
        if (api) {
          // Electron: ドロップされた File は .path を持つ。フォルダのみ受け付ける
          const entry = e.dataTransfer.items[0]?.webkitGetAsEntry?.();
          const file = e.dataTransfer.files[0] as (File & { path?: string }) | undefined;
          if (entry && !entry.isDirectory) return; // ファイルがドロップされたら無視
          const dir = file?.path;
          if (dir) await openFolderFromPath(dir);
          return;
        }
        // Web FSA: ディレクトリハンドルを取得して開く（非対応ブラウザは何もしない＝既存ボタンに任せる）
        const item = e.dataTransfer.items[0];
        const handle = await (item as DataTransferItem & {
          getAsFileSystemHandle?: () => Promise<FileSystemHandle | null>;
        })?.getAsFileSystemHandle?.();
        if (handle?.kind === 'directory') await openFolderFromHandle(handle as FileSystemDirectoryHandle);
      } catch {
        // ハンドル取得や読込の失敗は AlertDialog で通知（不正フォルダで落とさない）。
        // openFolderFrom* 内の失敗は既に loadError を立てるので、ここはその手前の例外用の保険。
        setLoadError(t('error.openBody'));
      }
    })();
  };

  return (
    <Flex
      direction="column"
      alignItems="center"
      justifyContent="center"
      gap="size-100"
      height="size-3000"
      UNSAFE_style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <Heading level={3}>{t('empty.title')}</Heading>
      <Text>{t('empty.body')}</Text>
      <DropZone $active={isDragging} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
        {t('empty.drop')}
      </DropZone>
    </Flex>
  );
};

export const Conte: React.FC = React.memo(() => {
  const fileName = useGlobal('globalFileName')[0];

  // プロジェクト未オープン時はカラムヘッダ/CUT 一覧を出さず、中央寄せの空状態ガイド + D&D ドロップゾーンを表示する。
  if (!fileName) {
    return <EmptyState />;
  }

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
