import React, { useState, useGlobal, useEffect } from 'reactn';
import { Key } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { ActionButton, Item, TabList, Tabs, Text, Picker, ActionGroup, MenuTrigger, Menu, DialogTrigger, Dialog } from '@adobe/react-spectrum';
import styled from 'styled-components';
import Home from '@spectrum-icons/workflow/Home';
import TableEdit from '@spectrum-icons/workflow/TableEdit';
import VideoFilled from '@spectrum-icons/workflow/VideoFilled';
import Share from '@spectrum-icons/workflow/Share';
import Branch2 from '@spectrum-icons/workflow/Branch2';
import Settings from '@spectrum-icons/workflow/Settings';
import DocumentOutline from '@spectrum-icons/workflow/DocumentOutline';
import ShowMenu from '@spectrum-icons/workflow/ShowMenu';
import { readPsd } from 'ag-psd';
import { useTitle } from 'hooks/useTitle';
import { useTitleEffects } from 'hooks/useTitleEffects';
import { buildProject, sortPsdNames, LoadedPsd } from 'project/load';
import { useProject } from 'hooks/useProject';
import { useAutoSave } from 'hooks/useAutoSave';
import { deriveFrame } from 'project/dimensions';
import { AspectKey, ResolutionKey } from 'project/types';
import { serializeProject, setLastPersisted, setPendingV1Backup, v1BackupName } from 'project/save';
import { getStorage, StorageOpenResult } from 'storage';
import { NewProjectDialog } from 'NewProjectDialog';
import { SettingsDialog } from 'SettingsDialog';
import { GitSnapshotPopover } from 'git/GitSnapshotPopover';
import { useT } from 'i18n';

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
  const t = useT();
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
          <Text>{t('header.tab.edit')}</Text>
        </Item>
        <Item key="Preview">
          <VideoFilled />
          <Text>{t('header.tab.preview')}</Text>
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

const SaveIndicator: React.FC = () => {
  const t = useT();
  const saveState = useAutoSave();
  const fileName = useGlobal('globalFileName')[0];
  const storage = getStorage();
  if (!fileName) return null;
  const label = !storage.capabilities.write
    ? t('header.save.readOnly')
    : {
        idle: '',
        dirty: t('header.save.dirty'),
        saving: t('header.save.saving'),
        saved: t('header.save.saved'),
        error: t('header.save.error'),
      }[saveState];
  if (!label) return null;
  return (
    <span
      style={{
        fontSize: '11px',
        opacity: 0.6,
        whiteSpace: 'nowrap',
        marginLeft: '8px',
        color: saveState === 'error' ? 'var(--spectrum-semantic-negative-color-border)' : 'inherit',
      }}
    >
      {label}
    </span>
  );
};

const GitBranchButton: React.FC = () => {
  const t = useT();
  const gitDetect = useGlobal('gitDetect')[0];
  // Web（api 不在で detect 未実行）では gitDetect undefined → VC 無効でアイコンを出さない
  if (!gitDetect) return null;
  return (
    <DialogTrigger type="popover">
      <ActionButton isQuiet aria-label={t('git.snapshot.heading')}>
        <Branch2 />
      </ActionButton>
      <Dialog size="S">
        <GitSnapshotPopover gitDetect={gitDetect} />
      </Dialog>
    </DialogTrigger>
  );
};

export const Header: React.FC = () => {
  const t = useT();
  const { project, setProject } = useProject();
  const setPsdCache = useGlobal('psdCache')[1];
  const setFileName = useGlobal('globalFileName')[1];
  const setIsLoading = useGlobal('isLoading')[1];

  // スピナーを描画させてから重い PSD パースに入るための1フレーム譲歩
  const yieldToPaint = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

  // 構築済みプロジェクトをグローバル状態へ反映する（Web/Electron 共通）
  const applyProject = (jsonText: string, psds: LoadedPsd[], jsonFileName: string) => {
    const { project: loaded, cache, wasV1 } = buildProject(jsonText, psds, jsonFileName);
    // 読み込み直後は「保存済み」扱い。v1 は初回保存時に元 JSON を退避する
    setLastPersisted(serializeProject(loaded));
    setPendingV1Backup(wasV1 ? { name: v1BackupName(jsonFileName), text: jsonText } : null);
    // fileName は最後に設定する（autoSave が古い project と新 fileName の組で誤発火しないように）
    setProject(loaded);
    setPsdCache(cache);
    setFileName(jsonFileName);
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

  // 外部編集の再読込用に Electron のフォルダパスを保持する
  const dirPathRef = React.useRef<string | null>(null);

  // フォルダから読み込んだ一式（PSD未パース）をパースして反映する（Web FSA/Electron 共通）
  const loadFromPayload = async (payload: StorageOpenResult | null) => {
    if (!payload) return;
    if (payload.dirPath) dirPathRef.current = payload.dirPath;
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

  const storage = getStorage();
  const setNewProjectOpen = useGlobal('newProjectOpen')[1];
  const setSettingsOpen = useGlobal('settingsOpen')[1];

  // Cmd/Ctrl+.（環境設定の慣用ショートカット）で設定ダイアログを開く
  useHotkeys(
    'command+.,ctrl+.',
    (event) => {
      event.preventDefault();
      setSettingsOpen(true);
    },
    [setSettingsOpen],
  );

  const openProject = async () => {
    if (storage.kind === 'web-readonly') {
      // File System Access API 非対応ブラウザは webkitdirectory で読み取り専用
      document.getElementById('inputDirectory')?.click();
      return;
    }
    loadFromPayload(await storage.openProject());
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

  // メニューの Preferences（Cmd/Ctrl+.）からの設定ダイアログ表示要求
  useEffect(() => {
    if (!api) return;
    const listener = () => setSettingsOpen(true);
    api.onOpenSettingsRequest(listener);
    return () => api.removeOpenSettingsRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 外部ペイントアプリで PSD が保存されたら自動で再読込する
  useEffect(() => {
    if (!api) return;
    const listener = () => {
      if (dirPathRef.current) {
        api.readProject(dirPathRef.current).then(loadFromPayload);
      }
    };
    api.onProjectFilesChanged(listener);
    return () => api.removeProjectFilesChanged();
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
        {!api && (
          <NoDragArea>
            <MenuTrigger>
              <ActionButton isQuiet aria-label={t('header.menu.ariaLabel')}>
                <ShowMenu />
              </ActionButton>
              <Menu
                onAction={(k) => {
                  if (k === 'new') setNewProjectOpen(true);
                  if (k === 'open') openProject();
                }}
              >
                <Item key="new">{t('header.menu.new')}</Item>
                <Item key="open">{t('header.menu.open')}</Item>
              </Menu>
            </MenuTrigger>
            <input type="file" style={{ display: 'none' }} id="inputDirectory" onChange={loadFile} />
          </NoDragArea>
        )}
        <NoDragArea>
          <NewProjectDialog />
        </NoDragArea>
        <NoDragArea>
          <SettingsDialog />
        </NoDragArea>
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
      <NoDragArea>
        <SaveIndicator />
      </NoDragArea>

      <HeaderRight>
        <GitBranchButton />
        <ActionGroup
          isQuiet
          onAction={(key) => {
            if (key === 'Settings') setSettingsOpen(true);
          }}
        >
          <Item key="Share">
            <Share />
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
