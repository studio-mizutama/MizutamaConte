import React, { useGlobal } from 'reactn';
import { Accordion } from 'Accordion';
import { List } from 'List';
import styled from 'styled-components';

const A = styled.a`
  text-decoration: none;
  display: inline-block;
  width: 100%;
  margin: 0;
  padding: 0;
`;

export const Outline: React.FC = () => {
  const cuts = useGlobal('globalCuts')[0];
  const setCut = useGlobal('cut')[1];

  return (
    <>
      <Accordion labelName="Scene1">
        {cuts?.length > 1 &&
          cuts?.map((cut, index) => (
            <List
              onClick={() => setCut(cut)}
              id={`List${index + 1}`}
              key={index}
              onMouseEnter={() => document.getElementById(`Cut${index + 1}`)?.classList.add('isHover')}
              onMouseLeave={() => document.getElementById(`Cut${index + 1}`)?.classList.remove('isHover')}
            >
              <A href={`#Cut${index + 1}`}>Cut{index + 1}</A>
            </List>
          ))}
      </Accordion>
    </>
  );
};
