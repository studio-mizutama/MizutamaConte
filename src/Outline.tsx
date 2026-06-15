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

const A = styled.a`
  text-decoration: none;
  display: inline-block;
  width: 100%;
  margin: 0;
  padding: 0;
`;

export const Outline: React.FC = () => {
  const cuts = usePsd();
  const { project } = useProject();
  const setCut = useGlobal('cut')[1];
  const setSelectedCutIndex = useGlobal('selectedCutIndex')[1];
  const [editorMode] = useEditorMode();
  const { reorderCutAt, reorderSceneAt } = useReorder();
  const scenes = deriveScenes(project.cuts);

  const isReorderCut = editorMode === 'reorderCut';
  const isReorderScene = editorMode === 'reorderScene';

  const { dragIndex, dropIndex, setDragIndex, setDropIndex, endDrag } = useRowDnd();

  const sceneOrderOfStart = useMemo(() => {
    const m = new Map<number, number>();
    scenes.forEach((s, order) => m.set(s.startIndex, order));
    return m;
  }, [scenes]);

  const onCutDrop = (to: number) => {
    const from = dragIndex;
    endDrag();
    if (from === null || from === to) return;
    // rename 失敗は useReorder 内で通知済み。この .catch は同期 throw（不正 index 等）のみを拾う防御ネット
    reorderCutAt(from, to).catch((err) => alert(err));
  };

  const onSceneDrop = (toStart: number) => {
    const fromStart = dragIndex;
    endDrag();
    if (fromStart === null) return;
    const fromScene = sceneOrderOfStart.get(fromStart);
    const toScene = sceneOrderOfStart.get(toStart);
    if (fromScene === undefined || toScene === undefined || fromScene === toScene) return;
    // rename 失敗は useReorder 内で通知済み。この .catch は同期 throw（不正 index 等）のみを拾う防御ネット
    reorderSceneAt(fromScene, toScene).catch((err) => alert(err));
  };

  return (
    <>
      {scenes.map((scene) => (
        <DraggableRow
          key={scene.startIndex}
          $dragging={isReorderScene && dragIndex === scene.startIndex}
          $dropTarget={isReorderScene && dropIndex === scene.startIndex}
          {...makeDragHandlers({
            onStart: isReorderScene ? () => setDragIndex(scene.startIndex) : undefined,
            onOver: isReorderScene ? () => setDropIndex(scene.startIndex) : undefined,
            onDrop: isReorderScene ? () => onSceneDrop(scene.startIndex) : undefined,
            onEnd: isReorderScene ? endDrag : undefined,
          })}
        >
          <Accordion labelName={`Scene${scene.sceneNumber}${scene.title ? ` ${scene.title}` : ''}`}>
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
                <DraggableRow
                  $dragging={isReorderCut && dragIndex === index}
                  $dropTarget={isReorderCut && dropIndex === index}
                  {...makeDragHandlers({
                    onStart: isReorderCut ? () => setDragIndex(index) : undefined,
                    onOver: isReorderCut ? () => setDropIndex(index) : undefined,
                    onDrop: isReorderCut ? () => onCutDrop(index) : undefined,
                    onEnd: isReorderCut ? endDrag : undefined,
                  })}
                >
                  <A href={`#Cut${index + 1}`}>Cut{index + 1}</A>
                </DraggableRow>
              </List>
            ))}
          </Accordion>
        </DraggableRow>
      ))}
    </>
  );
};
