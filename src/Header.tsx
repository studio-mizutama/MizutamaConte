import React, { useState, useGlobal, useEffect } from 'reactn';
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
import FolderOpenOutline from '@spectrum-icons/workflow/FolderOpenOutline';
import { readPsd, Psd } from 'ag-psd';

const { api } = window;

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
  ${window.navigator.userAgent.toLowerCase().indexOf('mac') !== -1 && api
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
  api &&
  `&::before {
    content: '';
    padding-left: var(--spectrum-global-dimension-size-700, var(--spectrum-alias-size-700));
  }`}
`;

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
  const [selected, setSelected] = useState('');
  const globalFileName = useGlobal('globalFileName')[0];
  useEffect(() => {
    const f = async () => {
      try {
        if (!api) {
          setSelected(globalFileName);
          return;
        }
        const fileName = await api.loadFileName();
        setSelected(fileName);
      } catch (e) {
        alert(e);
      }
    };
    f();
    return () => {
      api.removeFileName();
    };
  }, [globalFileName, setSelected]);
  return (
    <Picker
      isQuiet
      menuWidth="size-3400"
      max-width="fit-content"
      selectedKey={selected}
      onSelectionChange={setSelected as (keys: Key) => any}
    >
      <Item key={selected}>
        <DocumentOutline />
        <Text>{selected}</Text>
      </Item>
    </Picker>
  );
};

export const Header: React.FC = () => {
  const setCuts = useGlobal('globalCuts')[1];
  const setPsds = useGlobal('globalPsds')[1];
  const setFileName = useGlobal('globalFileName')[1];
  const loadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filelist = e.target.files;
    /* @ts-expect-error */
    const files = Array.from(filelist);
    const psdFiles = files.filter((file) => file.name.indexOf('.psd') !== -1);
    const jsonFile = files.filter((file) => file.name.indexOf('.json') !== -1)![0];
    const sortedPsdFiles = psdFiles
      .slice()
      .sort((a, b) => Number.parseInt(a.name.slice(1, 4)) - Number.parseInt(b.name.slice(1, 4)));

    setFileName(jsonFile.name);

    const loadPSD = (file: File) =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as ArrayBuffer);
        };
        reader.readAsArrayBuffer(file);
      });

    (async () => {
      let psds: Psd[] = [];
      await sortedPsdFiles.reduce(async (promise, file) => {
        return promise.then(async () => {
          psds.push(readPsd((await loadPSD(file)) as ArrayBuffer));
        });
      }, Promise.resolve());
      setPsds(psds);
    })();

    const loadJSON: Promise<string> = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsText(jsonFile, 'utf8');
    });
    //loadPSD.then((result) => console.log(result));
    loadJSON.then((result) => setCuts(JSON.parse(result)));
  };

  useEffect(() => {
    const inputDirectory = document.getElementById('inputDirectory');
    inputDirectory && inputDirectory.setAttribute('webkitdirectory', '');
    inputDirectory && inputDirectory.setAttribute('directory', '');
    inputDirectory && inputDirectory.setAttribute('multiple', '');
  }, []);

  return (
    <DragArea>
      <HeaderLeft>
        {!api && (
          <ActionButton isQuiet onPress={() => document.getElementById('inputDirectory')?.click()}>
            <FolderOpenOutline />
            <input type="file" style={{ display: 'none' }} id="inputDirectory" onChange={loadFile} />
          </ActionButton>
        )}
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
