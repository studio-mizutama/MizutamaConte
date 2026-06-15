import React, { useGlobal, useState, useMemo } from 'reactn';
import { Accordion } from 'Accordion';
import { List } from 'List';
import styled from 'styled-components';
import { usePsd } from 'hooks/usePsd';
import { useProject } from 'hooks/useProject';
import { deriveScenes } from 'project/scene';
import { useEditorMode } from 'hooks/editorMode';
import { useReorder } from 'hooks/useReorder';

const A = styled.a`
  text-decoration: none;
  display: inline-block;
  width: 100%;
  margin: 0;
  padding: 0;
`;

/** 並べ替えドラッグ用ラッパ。ドラッグ元は半透明、ドロップ先候補は上辺ハイライト */
const DragWrap = styled.div<{ $dragging: boolean; $dropTarget: boolean }>`
  opacity: ${(p) => (p.$dragging ? 0.4 : 1)};
  box-shadow: ${(p) =>
    p.$dropTarget ? 'inset 0 3px 0 0 var(--spectrum-semantic-informative-color-border, #2680eb)' : 'none'};
  cursor: grab;
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

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const sceneOrderOfStart = useMemo(() => {
    const m = new Map<number, number>();
    scenes.forEach((s, order) => m.set(s.startIndex, order));
    return m;
  }, [scenes]);

  const endDrag = () => {
    setDragIndex(null);
    setDropIndex(null);
  };

  const onCutDrop = (to: number) => {
    const from = dragIndex;
    endDrag();
    if (from === null || from === to) return;
    reorderCutAt(from, to).catch((err) => alert(err));
  };

  const onSceneDrop = (toStart: number) => {
    const fromStart = dragIndex;
    endDrag();
    if (fromStart === null) return;
    const fromScene = sceneOrderOfStart.get(fromStart);
    const toScene = sceneOrderOfStart.get(toStart);
    if (fromScene === undefined || toScene === undefined || fromScene === toScene) return;
    reorderSceneAt(fromScene, toScene).catch((err) => alert(err));
  };

  return (
    <>
      {scenes.map((scene) => (
        <DragWrap
          key={scene.startIndex}
          $dragging={isReorderScene && dragIndex === scene.startIndex}
          $dropTarget={isReorderScene && dropIndex === scene.startIndex}
          draggable={isReorderScene}
          onDragStart={isReorderScene ? () => setDragIndex(scene.startIndex) : undefined}
          onDragOver={
            isReorderScene
              ? (e: React.DragEvent) => {
                  e.preventDefault();
                  setDropIndex(scene.startIndex);
                }
              : undefined
          }
          onDrop={
            isReorderScene
              ? (e: React.DragEvent) => {
                  e.preventDefault();
                  onSceneDrop(scene.startIndex);
                }
              : undefined
          }
          onDragEnd={isReorderScene ? endDrag : undefined}
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
                <DragWrap
                  $dragging={isReorderCut && dragIndex === index}
                  $dropTarget={isReorderCut && dropIndex === index}
                  draggable={isReorderCut}
                  onDragStart={isReorderCut ? () => setDragIndex(index) : undefined}
                  onDragOver={
                    isReorderCut
                      ? (e: React.DragEvent) => {
                          e.preventDefault();
                          setDropIndex(index);
                        }
                      : undefined
                  }
                  onDrop={
                    isReorderCut
                      ? (e: React.DragEvent) => {
                          e.preventDefault();
                          onCutDrop(index);
                        }
                      : undefined
                  }
                  onDragEnd={isReorderCut ? endDrag : undefined}
                >
                  <A href={`#Cut${index + 1}`}>Cut{index + 1}</A>
                </DragWrap>
              </List>
            ))}
          </Accordion>
        </DragWrap>
      ))}
    </>
  );
};
