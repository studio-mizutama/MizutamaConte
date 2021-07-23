import React, { useGlobal, useState, useEffect } from 'reactn';
import { Accordion } from 'Accordion';
import { List } from 'List';
import { Psd } from 'ag-psd';
import styled from 'styled-components';
const { api } = window;

const A = styled.a`
  text-decoration: none;
  display: inline-block;
  width: 100%;
  margin: 0;
  padding: 0;
`;

export const Outline: React.FC = () => {
  const prtPsd: Psd = { width: 1, height: 1 };
  const prtCut: Cut = {
    picture: prtPsd,
  };
  const [cuts, setCuts] = useState([prtCut]);
  const setCut = useGlobal('cut')[1];

  useEffect(() => {
    const f = async () => {
      try {
        const json = await api.loadJSON();
        const cutsWithNoPicture: Cut[] = json;
        setCuts(cutsWithNoPicture);
      } catch (e) {
        alert(e);
      }
    };
    f();
  }, []);
  return (
    <>
      <Accordion labelName="Scene1">
        {cuts.map((cut, index) => (
          <List onClick={() => setCut(cut)} id={`List${index + 1}`}>
            <A href={`#Cut${index + 1}`}>Cut{index + 1}</A>
          </List>
        ))}
      </Accordion>
    </>
  );
};
