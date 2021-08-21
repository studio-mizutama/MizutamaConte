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
import ShowMenu from '@spectrum-icons/workflow/ShowMenu';
import { readPsd, Psd } from 'ag-psd';
import { useTitle } from 'hooks/useTitle';
import { useTitleEffects } from 'hooks/useTitleEffects';

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
  ${window.navigator.userAgent.toLowerCase().indexOf('mac') === -1 && api
    ? `margin-right: 0;`
    : `margin-right: var(--spectrum-global-dimension-size-100, var(--spectrum-alias-size-100));`}
  ${window.navigator.userAgent.toLowerCase().indexOf('mac') !== -1 &&
  api &&
  `&::before {
    content: '';
    padding-left: var(--spectrum-global-dimension-size-700, var(--spectrum-alias-size-700));
  }`}
`;

const WindowsButtons = styled.div`
  display: flex;
  align-items: center;
  margin-left: var(--spectrum-global-dimension-size-400, var(--spectrum-alias-size-400));
  margin-right: 0;
  padding: 0;
`;

const Button = styled.svg`
  padding: 0;
  margin: 0;
  fill: none;
  stroke: var(--spectrum-alias-text-color);
  path {
    fill: none;
    stroke: var(--spectrum-alias-text-color);
  }
  rect {
    fill: none;
    stroke: var(--spectrum-alias-text-color);
  }
`;

const ButtonWrapper = styled.div`
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  width: 40px;
  :hover {
    background-color: var(--spectrum-alias-highlight-hover);
  }
`;

const CloseButtonWrapper = styled.div`
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  width: 40px;
  :hover {
    background-color: var(--spectrum-semantic-negative-color-border);
    margin-right: -1px;
    border-right: 1px solid var(--spectrum-semantic-negative-color-border);
    path {
      fill: none;
      stroke: var(--spectrum-global-color-static-gray-200);
    }
    rect {
      fill: none;
      stroke: var(--spectrum-global-color-static-gray-200);
    }
  }
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

  const [maximized, setMaximized, , setBlur] = useTitle(false, false);

  const onMinimize = async () => {
    await api.minimize();
  };

  const onMaximize = async () => {
    setMaximized(!maximized);
    await api.maximize();
  };

  const onRestore = async () => {
    setMaximized(!maximized);
    await api.restore();
  };

  const onClose = async () => await api.close();

  const onContextMenu = () => {
    api.contextMenu();
  };

  useTitleEffects(setMaximized, setBlur);

  return (
    <DragArea>
      <HeaderLeft>
        {!api && (
          <ActionButton isQuiet onPress={() => document.getElementById('inputDirectory')?.click()}>
            <FolderOpenOutline />
            <input type="file" style={{ display: 'none' }} id="inputDirectory" onChange={loadFile} />
          </ActionButton>
        )}
        {window.navigator.userAgent.toLowerCase().indexOf('mac') === -1 && api && (
          <ActionButton isQuiet onPress={onContextMenu}>
            <ShowMenu />
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
        {window.navigator.userAgent.toLowerCase().indexOf('mac') === -1 && api && (
          <WindowsButtons>
            <ActionButton isQuiet onPress={onMinimize}>
              <ButtonWrapper>
                <Button width="10" height="1" viewBox="0 0 10 1" fill="none" xmlns="http://www.w3.org/2000/Button">
                  <rect width="10" height="1" />
                </Button>
              </ButtonWrapper>
            </ActionButton>
            {maximized ? (
              <ActionButton isQuiet onPress={onRestore}>
                <ButtonWrapper>
                  <Button width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/Button">
                    <path fillRule="evenodd" clipRule="evenodd" d="M9 1H3V2H2V1V0H3H9H10V1V7V8H9H8V7H9V1Z" />
                    <rect x="0.5" y="2.5" width="7" height="7" />
                  </Button>
                </ButtonWrapper>
              </ActionButton>
            ) : (
              <ActionButton isQuiet onPress={onMaximize}>
                <ButtonWrapper>
                  <Button width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/Button">
                    <rect x="0.5" y="0.5" width="9" height="9" />
                  </Button>
                </ButtonWrapper>
              </ActionButton>
            )}
            <ActionButton isQuiet onPress={onClose}>
              <CloseButtonWrapper>
                <Button width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/Button">
                  <path d="M1 11L11 1" />
                  <path d="M1 1L11 11" />
                </Button>
              </CloseButtonWrapper>
            </ActionButton>
          </WindowsButtons>
        )}
      </HeaderRight>
    </DragArea>
  );
};
