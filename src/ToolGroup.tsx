import React, { useState } from 'reactn';
import { ActionGroup, Item, Tooltip, TooltipTrigger } from '@adobe/react-spectrum';
import styled from 'styled-components';
import Select from '@spectrum-icons/workflow/Select';
import Crop from '@spectrum-icons/workflow/Crop';
import Text from '@spectrum-icons/workflow/Text';
import { Selection } from '@react-types/shared/src/selection';
import { useHotkeys } from 'react-hotkeys-hook';

const AlignCenter = styled.div`
  display: flex;
  justify-content: center;
  margin-top: var(--spectrum-global-dimension-size-85, var(--spectrum-alias-size-85));
`;

export const ToolGroup: React.FC = () => {
  const [selected, setSelected] = useState(new Set(['Select']));

  const keyDown = () => {
    const activeElement = document.activeElement as HTMLElement;
    activeElement.blur();
  };

  useHotkeys('v', () => {
    setSelected(new Set(['Select']));
    keyDown();
  });

  useHotkeys('c', () => {
    setSelected(new Set(['Crop']));
    keyDown();
  });

  useHotkeys('t', () => {
    setSelected(new Set(['Text']));
    keyDown();
  });

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
        <TooltipTrigger placement="end">
          <Item key="Select">
            <Select />
          </Item>
          <Tooltip>Select (V)</Tooltip>
        </TooltipTrigger>
        <TooltipTrigger placement="end">
          <Item key="Crop">
            <Crop />
          </Item>
          <Tooltip>Crop (C)</Tooltip>
        </TooltipTrigger>
        <TooltipTrigger placement="end">
          <Item key="Text">
            <Text />
          </Item>
          <Tooltip>Text (T)</Tooltip>
        </TooltipTrigger>
      </ActionGroup>
    </AlignCenter>
  );
};
