import React, { useGlobal, useMemo } from 'reactn';
import { Accordion } from 'Accordion';
import { List } from 'List';
import styled from 'styled-components';
import { usePsd } from 'hooks/usePsd';
import { useProject } from 'hooks/useProject';
import { deriveScenes } from 'project/scene';
import { useEditorMode } from 'hooks/editorMode';
import { useReorder } from 'hooks/useReorder';
import { useRowDnd, makeDragHandlers } from 'hooks/useRowDnd';
import { DraggableRow } from 'styles/DraggableRow';

/**
 * アウトラインの CUT リンク。
 * 並べ替え用のドラッグ配線とドロップ指示子をこの要素に直接付ける（ラッパ div を挟まない）。
 * ラッパ div を足すと inline-block の <a> の外に block 行が増え、行の寸法が
 * 元(DnD導入前)より大きくなる退行が出るため、styled.a 自体を draggable 行にする。
 * - inline-block / width:100% は元の <A> と同一（寸法を退行させない）
 * - ドロップ指示子は DraggableRow と同方式（上辺に挿入線）を ::before で描く
 */
const DragLink = styled.a<{ $dragging: boolean; $dropTarget: boolean; $reorder: boolean }>`
  position: relative;
  text-decoration: none;
  display: inline-block;
  width: 100%;
  margin: 0;
  padding: 0;
  opacity: ${(p) => (p.$dragging ? 0.4 : 1)};
  cursor: ${(p) => (p.$reorder ? (p.$dragging ? 'grabbing' : 'grab') : 'pointer')};

  /* ドロップ先境界の挿入線（CUT と CUT の間に入ることを示す 3px ライン） */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: -2px;
    height: 3px;
    border-radius: 2px;
    background: var(--spectrum-semantic-informative-color-border, #2680eb);
    opacity: ${(p) => (p.$dropTarget ? 1 : 0)};
    pointer-events: none;
    z-index: 5;
  }
`;

export const Outline: React.FC = () => {
  const cuts = usePsd();
  const { project } = useProject();
  const setCut = useGlobal('cut')[1];
  const setSelectedCutIndex = useGlobal('selectedCutIndex')[1];
  const [editorMode] = useEditorMode();
  const { reorderCutAt, reorderSceneAt } = useReorder();
  const scenes = deriveScenes(project.cuts);

  // 並べ替えモードでは CUT リンク・SCENE 帯の両方を draggable にし、
  // ドラッグ種別(dragKind)でドロップ可能域と並べ替え対象を切り替える。
  const isReorder = editorMode === 'reorder';
  const { dragIndex, dropIndex, dragKind, startDrag, setDropIndex, endDrag } = useRowDnd();
  const isDraggingCut = dragKind === 'cut';
  const isDraggingScene = dragKind === 'scene';

  const sceneOrderOfStart = useMemo(() => {
    const m = new Map<number, number>();
    scenes.forEach((s, order) => m.set(s.startIndex, order));
    return m;
  }, [scenes]);

  const onCutDrop = (to: number) => {
    const from = dragIndex;
    endDrag();
    if (from === null || from === to) return;
    // 防御ネット。現状どの経路も reject しない（moveItem はガード済で throw せず、applyReorderWith は失敗時に内部で notifyError 済）が、将来の rejection への安価な保険として残す
    reorderCutAt(from, to).catch((err) => alert(err));
  };

  const onSceneDrop = (toStart: number) => {
    const fromStart = dragIndex;
    endDrag();
    if (fromStart === null) return;
    const fromScene = sceneOrderOfStart.get(fromStart);
    const toScene = sceneOrderOfStart.get(toStart);
    if (fromScene === undefined || toScene === undefined || fromScene === toScene) return;
    // 防御ネット。現状どの経路も reject しない（moveItem はガード済で throw せず、applyReorderWith は失敗時に内部で notifyError 済）が、将来の rejection への安価な保険として残す
    reorderSceneAt(fromScene, toScene).catch((err) => alert(err));
  };

  return (
    <>
      {scenes.map((scene) => (
        // 外側ラッパは draggable にしない（draggable にするとシーンブロック全体がドラッグ面となり
        // アウトラインのスクロールを奪う）。ドロップ受け(onDragOver/onDrop)と位置決め(position:relative)
        // のみ担い、シーンのドラッグ開始は Accordion 見出し(headerProps)に限定する。
        <DraggableRow
          key={scene.startIndex}
          $cursor="default"
          $dragging={isDraggingScene && dragIndex === scene.startIndex}
          $dropTarget={isDraggingScene && dropIndex === scene.startIndex}
          {...makeDragHandlers({
            onOver: isDraggingScene ? () => setDropIndex(scene.startIndex) : undefined,
            onDrop: isDraggingScene ? () => onSceneDrop(scene.startIndex) : undefined,
          })}
        >
          <Accordion
            labelName={`Scene${scene.sceneNumber}${scene.title ? ` ${scene.title}` : ''}`}
            // シーン並べ替えのドラッグ取っ手は見出しだけに付ける（余白・CUT 列はスクロール可能のまま）
            headerProps={makeDragHandlers({
              onStart: isReorder ? () => startDrag('scene', scene.startIndex) : undefined,
              onEnd: isReorder ? endDrag : undefined,
            })}
          >
            {scene.cutIndices.map((index) => (
              <List
                onClick={() => {
                  setCut(cuts[index]);
                  setSelectedCutIndex(index);
                }}
                id={`List${index + 1}`}
                key={index}
                onMouseEnter={() => document.getElementById(`Cut${index + 1}`)?.classList.add('isHover')}
                onMouseLeave={() => document.getElementById(`Cut${index + 1}`)?.classList.remove('isHover')}
              >
                <DragLink
                  href={`#Cut${index + 1}`}
                  $reorder={isReorder}
                  $dragging={isDraggingCut && dragIndex === index}
                  $dropTarget={isDraggingCut && dropIndex === index}
                  {...makeDragHandlers({
                    onStart: isReorder ? () => startDrag('cut', index) : undefined,
                    onOver: isDraggingCut ? () => setDropIndex(index) : undefined,
                    onDrop: isDraggingCut ? () => onCutDrop(index) : undefined,
                    onEnd: isReorder ? endDrag : undefined,
                  })}
                >
                  Cut{index + 1}
                </DragLink>
              </List>
            ))}
          </Accordion>
        </DraggableRow>
      ))}
    </>
  );
};
