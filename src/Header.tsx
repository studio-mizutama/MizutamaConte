import React, { useState, useGlobal } from 'reactn';
import { Key } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { ActionButton, Item, TabList, Tabs, Text, Picker, ActionGroup } from '@adobe/react-spectrum';
import styled from 'styled-components';
import Home from '@spectrum-icons/workflow/Home';
import TableEdit from '@spectrum-icons/workflow/TableEdit';
import VideoFilled from '@spectrum-icons/workflow/VideoFilled';
import Share from '@spectrum-icons/workflow/Share';
import Branch2 from '@spectrum-icons/workflow/Branch2';
import Settings from '@spectrum-icons/workflow/Settings';
import DocumentOutline from '@spectrum-icons/workflow/DocumentOutline';

const DragArea = styled.div`
  -webkit-app-region: drag;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const NoDragArea = styled.div`
  -webkit-app-region: no-drag;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  ${window.navigator.userAgent.toLowerCase().indexOf('mac') !== -1
    ? `margin-left: var(--spectrum-global-dimension-size-800, var(--spectrum-alias-size-800));`
    : `margin-left: var(--spectrum-global-dimension-size-100, var(--spectrum-alias-size-100));`}
  margin-right: auto;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  margin-right: var(--spectrum-global-dimension-size-100, var(--spectrum-alias-size-100));
  ${window.navigator.userAgent.toLowerCase().indexOf('mac') !== -1 &&
  `&::before {
    content: '';
    padding-left: var(--spectrum-global-dimension-size-700, var(--spectrum-alias-size-700));
  }`}
`;

//const { api } = window;
//const platform = api.loadPlatform();
//platform.then((result) => console.log(result));

const Tab: React.FC = () => {
  const [selected, setSelected] = useGlobal('mode');

  const keyDown = () => {
    const activeElement = document.activeElement as HTMLElement;
    activeElement.blur();
  };

  useHotkeys('e', () => {
    setSelected('Edit');
    keyDown();
  });

  useHotkeys('p', () => {
    setSelected('Preview');
    keyDown();
  });

  return (
    <Tabs width="fit-content" selectedKey={selected} onSelectionChange={setSelected as (keys: Key) => any}>
      <TabList maxHeight="size-500">
        <Item key="Edit">
          <TableEdit />
          <Text>Edit</Text>
        </Item>
        <Item key="Preview">
          <VideoFilled />
          <Text>Preview</Text>
        </Item>
      </TabList>
    </Tabs>
  );
};

const FilePicker: React.FC = () => {
  const [selected, setSelected] = useState('MizutamaConte.json');
  return (
    <Picker
      isQuiet
      menuWidth="size-3400"
      max-width="fit-content"
      selectedKey={selected}
      onSelectionChange={setSelected as (keys: Key) => any}
    >
      <Item key="MizutamaConte.json">
        <DocumentOutline />
        <Text>MizutamaConte.json</Text>
      </Item>
      <Item key="MinorinConte.json">
        <DocumentOutline />
        <Text>MinorinConte.json</Text>
      </Item>
    </Picker>
  );
};

export const Header: React.FC = () => {
  return (
    <DragArea>
      <HeaderLeft>
        <ActionButton isQuiet marginX="size-200">
          <Home />
        </ActionButton>
        <NoDragArea>
          <Tab />
        </NoDragArea>
      </HeaderLeft>

      <FilePicker />

      <HeaderRight>
        <ActionGroup isQuiet>
          <Item key="Share">
            <Share />
          </Item>
          <Item key="Branch2">
            <Branch2 />
          </Item>
          <Item key="Settings">
            <Settings />
          </Item>
        </ActionGroup>
      </HeaderRight>
    </DragArea>
  );
};
