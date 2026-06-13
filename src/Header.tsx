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
import { readPsd } from 'ag-psd';
import { useTitle } from 'hooks/useTitle';
import { useTitleEffects } from 'hooks/useTitleEffects';
import { buildProject, sortPsdNames, LoadedPsd } from 'project/load';
import { useProject } from 'hooks/useProject';
import { deriveFrame } from 'project/dimensions';
import { AspectKey, ResolutionKey } from 'project/types';

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
    setSelected(globalFileName);
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
  const { project, setProject } = useProject();
  const setPsdCache = useGlobal('psdCache')[1];
  const setFileName = useGlobal('globalFileName')[1];
  const setIsLoading = useGlobal('isLoading')[1];

  // スピナーを描画させてから重い PSD パースに入るための1フレーム譲歩
  const yieldToPaint = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

  // 構築済みプロジェクトをグローバル状態へ反映する（Web/Electron 共通）
  const applyProject = (jsonText: string, psds: LoadedPsd[], jsonFileName: string) => {
    const { project, cache } = buildProject(jsonText, psds, jsonFileName);
    setFileName(jsonFileName);
    setProject(project);
    setPsdCache(cache);
  };

  // Web: <input webkitdirectory> からの読み込み
  const loadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filelist = e.target.files;
    if (!filelist) return;
    const files = Array.from(filelist);
    const psdFiles = files.filter((file) => file.name.toLowerCase().endsWith('.psd'));
    const jsonFile = files.find((file) => file.name.toLowerCase().endsWith('.json'));
    if (!jsonFile) return;
    const sortedNames = sortPsdNames(psdFiles.map((file) => file.name));
    const sortedPsdFiles = sortedNames.map((name) => psdFiles.find((file) => file.name === name)!);

    const readAsArrayBuffer = (file: File) =>
      new Promise<ArrayBuffer>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.readAsArrayBuffer(file);
      });
    const readAsText = (file: File) =>
      new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(file, 'utf8');
      });

    (async () => {
      try {
        await setIsLoading(true);
        await yieldToPaint();
        const jsonText = await readAsText(jsonFile);
        const psds: LoadedPsd[] = [];
        for (const file of sortedPsdFiles) {
          psds.push({ name: file.name, psd: readPsd(await readAsArrayBuffer(file)) });
        }
        applyProject(jsonText, psds, jsonFile.name);
      } catch (err) {
        alert(err);
      } finally {
        setIsLoading(false);
      }
    })();
  };

  useEffect(() => {
    const inputDirectory = document.getElementById('inputDirectory');
    inputDirectory && inputDirectory.setAttribute('webkitdirectory', '');
    inputDirectory && inputDirectory.setAttribute('directory', '');
    inputDirectory && inputDirectory.setAttribute('multiple', '');
  }, []);

  // Electron: main から受け取ったプロジェクト一式をグローバル状態へ反映する
  const loadFromPayload = async (payload: ProjectPayload | null) => {
    if (!payload) return;
    try {
      await setIsLoading(true);
      await yieldToPaint();
      const psds: LoadedPsd[] = payload.psds.map(({ name, data }) => ({ name, psd: readPsd(data) }));
      applyProject(payload.jsonText, psds, payload.jsonFileName);
    } catch (err) {
      alert(err);
    } finally {
      setIsLoading(false);
    }
  };

  const openProject = async () => {
    if (!api) {
      document.getElementById('inputDirectory')?.click();
      return;
    }
    loadFromPayload(await api.openProject());
  };

  // メニューの File > Open からの読み込み要求
  useEffect(() => {
    if (!api) return;
    const listener = () => {
      api.openProject().then(loadFromPayload);
    };
    api.onOpenProjectRequest(listener);
    return () => api.removeOpenProjectRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 開発時の回帰テスト用: ダイアログなしでプロジェクトを開く
  useEffect(() => {
    if (api && import.meta.env.DEV) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__loadProjectByPath = async (dirPath: string) =>
        loadFromPayload(await api.readProject(dirPath));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 開発時の検証用: 解像度・アスペクト比を切り替える（設定UIは Phase 4 で実装）
  useEffect(() => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__setProjectSettings = (resolution: ResolutionKey, aspect: AspectKey) =>
        setProject({
          ...project,
          settings: { ...project.settings, resolution, aspect, frame: deriveFrame(resolution, aspect) },
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

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
        <ActionButton isQuiet onPress={openProject}>
          <FolderOpenOutline />
          {!api && <input type="file" style={{ display: 'none' }} id="inputDirectory" onChange={loadFile} />}
        </ActionButton>
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
