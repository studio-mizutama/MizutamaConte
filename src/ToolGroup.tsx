import React from 'reactn';
import { ActionGroup, Item, Tooltip, TooltipTrigger } from '@adobe/react-spectrum';
import styled from 'styled-components';
import Edit from '@spectrum-icons/workflow/Edit';
import Crop from '@spectrum-icons/workflow/Crop';
import Reorder from '@spectrum-icons/workflow/Reorder';
import ViewList from '@spectrum-icons/workflow/ViewList';
import { useHotkeys } from 'react-hotkeys-hook';
import { useEditorMode } from 'hooks/useTool';
import { useT } from 'i18n';

const AlignCenter = styled.div`
  display: flex;
  justify-content: center;
  margin-top: var(--spectrum-global-dimension-size-85, var(--spectrum-alias-size-85));
`;

export const ToolGroup: React.FC = () => {
  const t = useT();
  const [mode, setMode] = useEditorMode();

  const keyDown = () => {
    const activeElement = document.activeElement as HTMLElement;
    activeElement.blur();
  };

  useHotkeys('s', () => {
    setMode('edit');
    keyDown();
  });

  useHotkeys('c', () => {
    setMode('resize');
    keyDown();
  });

  useHotkeys('r', () => {
    setMode('reorderCut');
    keyDown();
  });

  useHotkeys('g', () => {
    setMode('reorderScene');
    keyDown();
  });

  return (
    <AlignCenter>
      <ActionGroup
        orientation="vertical"
        selectionMode="single"
        isQuiet
        isEmphasized
        selectedKeys={new Set([mode])}
        onSelectionChange={(keys) => {
          const k = (keys instanceof Set ? [...keys][0] : undefined) as
            | 'edit'
            | 'resize'
            | 'reorderCut'
            | 'reorderScene'
            | undefined;
          if (k) setMode(k);
        }}
      >
        <TooltipTrigger placement="end">
          <Item key="edit">
            <Edit />
          </Item>
          <Tooltip>{t('toolGroup.edit')}</Tooltip>
        </TooltipTrigger>
        <TooltipTrigger placement="end">
          <Item key="resize">
            <Crop />
          </Item>
          <Tooltip>{t('toolGroup.resize')}</Tooltip>
        </TooltipTrigger>
        <TooltipTrigger placement="end">
          <Item key="reorderCut">
            <Reorder />
          </Item>
          <Tooltip>{t('toolGroup.reorderCut')}</Tooltip>
        </TooltipTrigger>
        <TooltipTrigger placement="end">
          <Item key="reorderScene">
            <ViewList />
          </Item>
          <Tooltip>{t('toolGroup.reorderScene')}</Tooltip>
        </TooltipTrigger>
      </ActionGroup>
    </AlignCenter>
  );
};
