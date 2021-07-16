import { FC, useState, useEffect, useCallback, Key } from 'react';
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

export const ToolGroup: FC = () => {
  const [selected, setSelected] = useState(new Set(['Select']));

  const keyListener = useCallback((e) => {
    e.key === 'v' && setSelected(new Set(['Select']));
    e.key === 'c' && setSelected(new Set(['Crop']));
    e.key === 't' && setSelected(new Set(['Text']));
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', keyListener, false);
  }, [keyListener, selected]);

  const onClick = () => {
    const activeElement = document.activeElement as HTMLElement;
    activeElement.blur();
  };

  return (
    <AlignCenter>
      <ActionGroup
        orientation="vertical"
        selectionMode="single"
        isQuiet
        isEmphasized
        selectedKeys={selected}
        onSelectionChange={setSelected as (keys: Selection) => any}
        onAction={onClick as (keys: Key) => any}
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
