import React, { useState, useEffect, useCallback } from 'reactn';
import { ActionGroup, Item } from '@adobe/react-spectrum';
import styled from 'styled-components';
import Select from '@spectrum-icons/workflow/Select';
import Crop from '@spectrum-icons/workflow/Crop';
import Text from '@spectrum-icons/workflow/Text';
import { Selection } from '@react-types/shared/src/selection';

const AlignCenter = styled.div`
  display: flex;
  justify-content: center;
  margin-top: var(--spectrum-global-dimension-size-85, var(--spectrum-alias-size-85));
`;

export const ToolGroup: React.FC = () => {
  const [selected, setSelected] = useState(new Set(['Select']));

  const keyListener = useCallback((e) => {
    e.key === 'v' && !e.ctrlKey && !e.shifKey && !e.altKey && !e.metaKey && setSelected(new Set(['Select']));
    e.key === 'c' && !e.ctrlKey && !e.shifKey && !e.altKey && !e.metaKey && setSelected(new Set(['Crop']));
    e.key === 't' && !e.ctrlKey && !e.shifKey && !e.altKey && !e.metaKey && setSelected(new Set(['Text']));
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', keyListener, false);
    //const activeElement = document.activeElement as HTMLElement;
    //activeElement.blur();
  }, [keyListener, selected]);

  return (
    <AlignCenter>
      <ActionGroup
        orientation="vertical"
        selectionMode="single"
        isQuiet
        isEmphasized
        selectedKeys={selected}
        onSelectionChange={setSelected as (keys: Selection) => any}
      >
        <Item key="Select">
          <Select />
        </Item>
        <Item key="Crop">
          <Crop />
        </Item>
        <Item key="Text">
          <Text />
        </Item>
      </ActionGroup>
    </AlignCenter>
  );
};
