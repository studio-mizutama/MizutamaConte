import React from 'reactn';
import { ActionGroup, Item, Tooltip, TooltipTrigger } from '@adobe/react-spectrum';
import styled from 'styled-components';
import Select from '@spectrum-icons/workflow/Select';
import Crop from '@spectrum-icons/workflow/Crop';
import Reorder from '@spectrum-icons/workflow/Reorder';
import { useHotkeys } from 'react-hotkeys-hook';
import { EditorMode, useEditorMode } from 'hooks/editorMode';
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

  // ショートカット: v=選択(既定・Adobe 系と同じ手癖) / c=resize / r=reorder
  useHotkeys('v', () => {
    setMode('edit');
    keyDown();
  });

  useHotkeys('c', () => {
    setMode('resize');
    keyDown();
  });

  useHotkeys('r', () => {
    setMode('reorder');
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
          const k = (keys instanceof Set ? [...keys][0] : undefined) as EditorMode | undefined;
          if (k) setMode(k);
        }}
      >
        <TooltipTrigger placement="end">
          <Item key="edit">
            <Select />
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
          <Item key="reorder">
            <Reorder />
          </Item>
          <Tooltip>{t('toolGroup.reorder')}</Tooltip>
        </TooltipTrigger>
      </ActionGroup>
    </AlignCenter>
  );
};
