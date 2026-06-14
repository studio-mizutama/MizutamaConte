import React, { useGlobal } from 'reactn';
import { Accordion } from 'Accordion';
import { List } from 'List';
import styled from 'styled-components';
import { usePsd } from 'hooks/usePsd';
import { useProject } from 'hooks/useProject';
import { deriveScenes } from 'project/scene';

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
  const scenes = deriveScenes(project.cuts);

  return (
    <>
      {scenes.map((scene) => (
        <Accordion key={scene.startIndex} labelName={`Scene${scene.sceneNumber}${scene.title ? ` ${scene.title}` : ''}`}>
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
              <A href={`#Cut${index + 1}`}>Cut{index + 1}</A>
            </List>
          ))}
        </Accordion>
      ))}
    </>
  );
};
