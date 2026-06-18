import React, { useGlobal } from 'reactn';
import { ActionButton, ActionGroup, Flex, Item, Tooltip, TooltipTrigger } from '@adobe/react-spectrum';
import styled from 'styled-components';
import Select from '@spectrum-icons/workflow/Select';
import Crop from '@spectrum-icons/workflow/Crop';
import Reorder from '@spectrum-icons/workflow/Reorder';
import Undo from '@spectrum-icons/workflow/Undo';
import Redo from '@spectrum-icons/workflow/Redo';
import Stopwatch from '@spectrum-icons/workflow/Stopwatch';
import { useHotkeys } from 'react-hotkeys-hook';
import { EditorMode, useEditorMode } from 'hooks/editorMode';
import { useUndoRedoControls } from 'hooks/useUndoRedoControls';
import { useT } from 'i18n';

const AlignCenter = styled.div`
  display: flex;
  justify-content: center;
  margin-top: var(--spectrum-global-dimension-size-85, var(--spectrum-alias-size-85));
`;

export const ToolGroup: React.FC = () => {
  const t = useT();
  const [mode, setMode] = useEditorMode();
  const tab = useGlobal('mode')[0];
  const isPreview = tab === 'Preview';
  // 注: Preview→Edit 復帰時の「選択ツール(V)へリセット」は Header.selectTab に移管した
  // （editorMode を mode 切替の前に確定することで Conte へ確実に反映＝残置バグ修正）。
  const { doUndo, doRedo, canUndo, canRedo } = useUndoRedoControls();
  const fileName = useGlobal('globalFileName')[0];

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

  useHotkeys('t', () => {
    setMode('stopwatch');
    keyDown();
  });

  return (
    <Flex direction="column" alignItems="center" height="100%">
      <AlignCenter>
        <ActionGroup
          orientation="vertical"
          selectionMode="single"
          isQuiet
          isEmphasized
          isDisabled={!fileName || isPreview}
          selectedKeys={fileName && !isPreview ? new Set([mode]) : new Set()}
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
          <TooltipTrigger placement="end">
            <Item key="stopwatch">
              <Stopwatch />
            </Item>
            <Tooltip>{t('toolGroup.stopwatch')}</Tooltip>
          </TooltipTrigger>
        </ActionGroup>
      </AlignCenter>
      <Flex direction="column" alignItems="center" gap="size-50" marginTop="auto" marginBottom="size-100">
        <TooltipTrigger placement="end">
          <ActionButton
            isQuiet
            aria-label={t('toolGroup.undo')}
            isDisabled={!fileName || !canUndo}
            onPress={() => void doUndo()}
          >
            <Undo />
          </ActionButton>
          <Tooltip>{t('toolGroup.undo')}</Tooltip>
        </TooltipTrigger>
        <TooltipTrigger placement="end">
          <ActionButton
            isQuiet
            aria-label={t('toolGroup.redo')}
            isDisabled={!fileName || !canRedo}
            onPress={() => void doRedo()}
          >
            <Redo />
          </ActionButton>
          <Tooltip>{t('toolGroup.redo')}</Tooltip>
        </TooltipTrigger>
      </Flex>
    </Flex>
  );
};
