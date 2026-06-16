import React, { useState, useGlobal, useEffect } from 'reactn';
import { Key } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  ActionButton,
  AlertDialog,
  DialogContainer,
  Item,
  Section,
  TabList,
  Tabs,
  Text,
  Picker,
  Flex,
  MenuTrigger,
  Menu,
  DialogTrigger,
  Dialog,
  Tooltip,
  TooltipTrigger,
} from '@adobe/react-spectrum';
import styled from 'styled-components';
import TableEdit from '@spectrum-icons/workflow/TableEdit';
import VideoFilled from '@spectrum-icons/workflow/VideoFilled';
import Share from '@spectrum-icons/workflow/Share';
import Branch2 from '@spectrum-icons/workflow/Branch2';
import Settings from '@spectrum-icons/workflow/Settings';
import DocumentOutline from '@spectrum-icons/workflow/DocumentOutline';
import ShowMenu from '@spectrum-icons/workflow/ShowMenu';
import { useTitle } from 'hooks/useTitle';
import { useTitleEffects } from 'hooks/useTitleEffects';
import { useProject } from 'hooks/useProject';
import { useAutoSave } from 'hooks/useAutoSave';
import { useOpenFolder } from 'hooks/useOpenFolder';
import { deriveFrame } from 'project/dimensions';
import { AspectKey, ResolutionKey, RecentProject } from 'project/types';
import { loadRecents } from 'storage/recentStore';
import { getStorage } from 'storage';
import { NewProjectDialog } from 'NewProjectDialog';
import { SettingsDialog } from 'SettingsDialog';
import { GitSnapshotPopover } from 'git/GitSnapshotPopover';
import { useT } from 'i18n';
import { TranslationKey } from 'i18n/catalogs/en';
import { usePrint } from 'print/usePrint';
import { useVideoExport } from 'hooks/useVideoExport';
import { useUndoRedoControls } from 'hooks/useUndoRedoControls';
import { AboutDialog } from 'AboutDialog';
import { WEB_MENU } from 'menuStructure';

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

// Web のハンバーガーだけに付ける右マージン。左の padding-left(12px) と対称にして
// ☰ の左右余白を揃える（Electron にはハンバーガーが無いので影響しない）。
const HamburgerArea = styled(NoDragArea)`
  margin-right: 12px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  /* Electron(mac) は信号機ボタンのゾーンを避けて左に余白を確保。
     web/非mac は旧 Home(marginX size-200) 相当の心地よい間隔を空ける */
  ${window.navigator.userAgent.toLowerCase().indexOf('mac') !== -1 && api
    ? `padding-left: 78px;`
    : `padding-left: 12px;`}
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

  // Web のみ: ⌘/Ctrl+1=編集 / ⌘/Ctrl+2=プレビュー（Electron は View メニューの accelerator が担う＝二重発火回避）。
  // ブラウザは ⌘+数字 をタブ切替に取られ得るため best-effort。確実な切替は e/p（上）。
  useHotkeys('command+1,ctrl+1', (e) => { if (api) return; e.preventDefault(); setSelected('Edit'); keyDown(); }, [setSelected]);
  useHotkeys('command+2,ctrl+2', (e) => { if (api) return; e.preventDefault(); setSelected('Preview'); keyDown(); }, [setSelected]);
  // Electron: View メニュー → menu:select-tab IPC
  useEffect(() => {
    if (!api?.onSelectTab) return;
    api.onSelectTab((tab) => setSelected(tab as 'Edit' | 'Preview'));
    return () => api.removeSelectTab?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const t = useT();
  const globalFileName = useGlobal('globalFileName')[0];
  const [recents, setRecents] = useState<RecentProject[]>([]);
  const { openRecent } = useOpenFolder();

  // globalFileName が変わるたびに最近リストを再取得する
  useEffect(() => {
    void loadRecents().then(setRecents);
  }, [globalFileName]);

  // 現在開いているファイル以外の最近プロジェクトを絞り込む
  const others = recents.filter((r) => r.name !== globalFileName);

  // react-spectrum Picker は条件付き Section を許容しないため、
  // 最近リストがある場合とない場合で children を切り替える
  const pickerChildren = others.length > 0 ? (
    <>
      <Section>
        <Item key={globalFileName || '__none__'} textValue={globalFileName}>
          <DocumentOutline />
          <Text>{globalFileName || ''}</Text>
        </Item>
      </Section>
      <Section title={t('header.recentProjects')}>
        {others.map((r) => (
          <Item key={r.id} textValue={r.name}>
            <DocumentOutline />
            <Text>{r.name}</Text>
          </Item>
        ))}
      </Section>
    </>
  ) : (
    <Section>
      <Item key={globalFileName || '__none__'} textValue={globalFileName}>
        <DocumentOutline />
        <Text>{globalFileName || ''}</Text>
      </Item>
    </Section>
  );

  return (
    <Picker
      isQuiet
      menuWidth="size-3400"
      max-width="fit-content"
      selectedKey={globalFileName || '__none__'}
      onSelectionChange={(key) => {
        const id = String(key);
        if (id === globalFileName || id === '__none__') return;
        const entry = recents.find((r) => r.id === id);
        if (entry) void openRecent(entry);
      }}
    >
      {pickerChildren}
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
  const fileName = useGlobal('globalFileName')[0];
  // Web（api 不在で detect 未実行）では gitDetect undefined → VC 無効でアイコンを出さない
  if (!gitDetect) return null;
  // プロジェクト未オープン時は非表示（git 操作はプロジェクトフォルダが必要なため）
  if (!fileName) return null;
  // Tooltip は DialogTrigger の外側に置く（内側に挟むと popover が開かない回帰になる）
  return (
    <TooltipTrigger delay={300}>
      <DialogTrigger type="popover">
        <ActionButton isQuiet aria-label={t('git.snapshot.heading')}>
          <Branch2 />
        </ActionButton>
        <Dialog size="S">
          <GitSnapshotPopover gitDetect={gitDetect} />
        </Dialog>
      </DialogTrigger>
      <Tooltip>{t('git.snapshot.heading')}</Tooltip>
    </TooltipTrigger>
  );
};

/** 不正プロジェクト読込時のエラーダイアログ。loadError が立つと表示し、OK で消す。
 *  Header は常時マウントされるため、Open/D&D/再読込のどの経路の失敗もここで拾える。 */
const LoadErrorDialog: React.FC = () => {
  const t = useT();
  const [loadError, setLoadError] = useGlobal('loadError');
  return (
    <DialogContainer onDismiss={() => setLoadError(null)}>
      {loadError && (
        <AlertDialog
          variant="error"
          title={t('error.openTitle')}
          primaryActionLabel={t('common.ok')}
          onPrimaryAction={() => setLoadError(null)}
        >
          {loadError}
        </AlertDialog>
      )}
    </DialogContainer>
  );
};

export const Header: React.FC = () => {
  const t = useT();
  const print = usePrint();
  const startVideoExport = useVideoExport();
  const { doUndo, doRedo, canUndo, canRedo } = useUndoRedoControls();
  const [aboutOpen, setAboutOpen] = useState(false);
  const fileName = useGlobal('globalFileName')[0];
  const { project, setProject } = useProject();

  // フォルダを開く一連の処理は useOpenFolder に集約（Conte の D&D ドロップゾーンと共有）。
  // 読込/検証/エラー化はすべてフック側に集約しているため、ここでは経路を呼ぶだけにする。
  const { loadFile, openFromPicker, reloadFromDirPath, reloadCurrentProject, openRecent, dirPathRef } = useOpenFolder();

  // Web ハンバーガー用の最近リスト（Electron では使用しない）
  const [hamburgerRecents, setHamburgerRecents] = useState<RecentProject[]>([]);
  useEffect(() => {
    if (api) return;
    void loadRecents().then(setHamburgerRecents);
  }, [fileName]);

  useEffect(() => {
    const inputDirectory = document.getElementById('inputDirectory');
    inputDirectory && inputDirectory.setAttribute('webkitdirectory', '');
    inputDirectory && inputDirectory.setAttribute('directory', '');
    inputDirectory && inputDirectory.setAttribute('multiple', '');
  }, []);

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

  // Cmd+Opt+R / Ctrl+Alt+R で現在のプロジェクトを再読込（Web/Electron 両対応）。
  // Electron ネイティブ View>Reload は Cmd/Ctrl+R のみのバインドなので衝突しない。
  // ブラウザのハードリロード(Cmd+Shift+R)とも別。reloadCurrentProject がプラットフォーム差を吸収する。
  // react-hotkeys-hook 3.x は 'mod' 非対応のため command/ctrl を明示（useUndoRedo と同じ流儀）。
  // プロジェクト未オープン時は no-op（生ページ reload を避ける）。
  useHotkeys(
    'command+alt+r,ctrl+alt+r',
    (event) => {
      event.preventDefault();
      if (!fileName) return;
      void reloadCurrentProject();
    },
    [fileName, reloadCurrentProject],
  );

  const openProject = async () => {
    if (storage.kind === 'web-readonly') {
      // File System Access API 非対応ブラウザは webkitdirectory で読み取り専用
      document.getElementById('inputDirectory')?.click();
      return;
    }
    // picker キャンセルは null を返すので openFromPicker（runOpen）が no-op、不正フォルダはエラー化する
    await openFromPicker(storage.openProject());
  };

  // メニューの File > Open からの読み込み要求
  useEffect(() => {
    if (!api) return;
    const listener = () => {
      void openFromPicker(api.openProject());
    };
    api.onOpenProjectRequest(listener);
    return () => api.removeOpenProjectRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // メニューの File > Print からの印刷要求（Electron のみ）
  useEffect(() => {
    if (!api) return;
    const listener = () => print();
    api.onPrintRequest(listener);
    return () => api.removePrintRequest();
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

  // メニューの Help > About（menu:about IPC）からのアプリ情報ダイアログ表示要求
  useEffect(() => {
    if (!api?.onAboutRequest) return;
    api.onAboutRequest(() => setAboutOpen(true));
    return () => api.removeAboutRequest?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 外部ペイントアプリで PSD が保存されたら自動で再読込する
  useEffect(() => {
    if (!api) return;
    const listener = () => {
      if (dirPathRef.current) {
        void reloadFromDirPath(dirPathRef.current);
      }
    };
    api.onProjectFilesChanged(listener);
    return () => api.removeProjectFilesChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // メニューの View > 再読み込み（Cmd/Ctrl+R）: 現在のフォルダをディスクから再読込し Open と同じ経路で反映。
  // 外部編集の再読込（project:files-changed）と同一パスで、applyProject 内で履歴もクリアされる。
  // プロジェクト未オープン時は no-op（生ページ reload を避ける）。
  useEffect(() => {
    if (!api?.onReloadProjectRequest) return;
    const listener = () => {
      if (dirPathRef.current) {
        // Cmd/Ctrl+R はキーボード操作なので react-spectrum がキーボードモダリティになり、
        // 再読込後に編集タブへ focus リングが乗ってしまう。読込完了後にフォーカスを外して回避する。
        void reloadFromDirPath(dirPathRef.current).then(() => {
          (document.activeElement as HTMLElement | null)?.blur();
        });
      }
    };
    api.onReloadProjectRequest(listener);
    return () => api.removeReloadProjectRequest?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 開発時の回帰テスト用: ダイアログなしでプロジェクトを開く
  useEffect(() => {
    if (api && import.meta.env.DEV) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__loadProjectByPath = async (dirPath: string) => reloadFromDirPath(dirPath);
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

  // Web ハンバーガーメニューの無効化キー（Undo/Redo は可否、再読込/印刷/動画はプロジェクト未オープンで無効）
  const hamburgerDisabled = [
    ...(!canUndo ? ['undo'] : []),
    ...(!canRedo ? ['redo'] : []),
    ...(!fileName ? ['reload', 'print', 'video'] : []),
  ];

  return (
    <DragArea>
      <HeaderLeft>
        {!api && (
          <HamburgerArea>
            <MenuTrigger>
              <ActionButton isQuiet aria-label={t('header.menu.ariaLabel')}>
                <ShowMenu />
              </ActionButton>
              <Menu
                disabledKeys={hamburgerDisabled}
                onAction={(k) => {
                  if (k === 'new') setNewProjectOpen(true);
                  else if (k === 'open') openProject();
                  else if (k === 'reload') void reloadCurrentProject();
                  else if (k === 'print') print();
                  else if (k === 'video') startVideoExport();
                  else if (k === 'undo') void doUndo();
                  else if (k === 'redo') void doRedo();
                  else if (k === 'documentation')
                    window.open('https://studio-mizutama.github.io/MizutamaConte/docs/', '_blank');
                  else if (k === 'about') setAboutOpen(true);
                  else if (k.toString().startsWith('recent:')) {
                    const id = k.toString().slice('recent:'.length);
                    const entry = hamburgerRecents.find((r) => r.id === id);
                    if (entry) void openRecent(entry);
                  }
                }}
              >
                {/* react-spectrum Menu は静的 Section と動的 Section を混在できないため
                    単一の children 配列として構築する */}
                {[
                  ...WEB_MENU.map((s) => (
                    <Section key={s.key} title={t(s.titleKey as TranslationKey)} items={s.items}>
                      {(it) => <Item key={it.key}>{t(it.labelKey as TranslationKey)}</Item>}
                    </Section>
                  )),
                  ...(hamburgerRecents.length > 0
                    ? [
                        <Section key="recent" title={t('header.recentProjects')}>
                          {hamburgerRecents.map((r) => (
                            <Item key={`recent:${r.id}`}>{r.name}</Item>
                          ))}
                        </Section>,
                      ]
                    : []),
                ]}
              </Menu>
            </MenuTrigger>
            <input type="file" style={{ display: 'none' }} id="inputDirectory" onChange={loadFile} />
          </HamburgerArea>
        )}
        <NoDragArea>
          <NewProjectDialog />
        </NoDragArea>
        <NoDragArea>
          <SettingsDialog />
        </NoDragArea>
        <AboutDialog isOpen={aboutOpen} onOpenChange={setAboutOpen} />
        <LoadErrorDialog />
        {window.navigator.userAgent.toLowerCase().indexOf('mac') === -1 && api && (
          <ActionButton isQuiet onPress={onContextMenu}>
            <ShowMenu />
          </ActionButton>
        )}
        <NoDragArea>
          <Tab />
        </NoDragArea>
      </HeaderLeft>

      <FilePicker />
      <NoDragArea>
        <SaveIndicator />
      </NoDragArea>

      <HeaderRight>
        {/* Share → Branch2(バージョン管理) → Settings を等間隔で並べる */}
        <Flex alignItems="center" gap="size-100">
          {/* Tooltip は MenuTrigger の外側に置く（react-spectrum の menu/dialog ボタン + tooltip の合成法） */}
          <TooltipTrigger delay={300}>
            <MenuTrigger>
              <ActionButton isQuiet aria-label={t('header.share.ariaLabel')} isDisabled={!fileName}>
                <Share />
              </ActionButton>
              <Menu
                onAction={(key) => {
                  if (key === 'pdf') print();
                  else if (key === 'video') startVideoExport();
                }}
              >
                <Item key="pdf">{t('header.share.pdf')}</Item>
                <Item key="video">{t('header.share.video')}</Item>
              </Menu>
            </MenuTrigger>
            <Tooltip>{t('header.share.ariaLabel')}</Tooltip>
          </TooltipTrigger>
          <GitBranchButton />
          <TooltipTrigger delay={300}>
            <ActionButton isQuiet aria-label={t('header.settings.ariaLabel')} onPress={() => setSettingsOpen(true)}>
              <Settings />
            </ActionButton>
            <Tooltip>{t('header.settings.ariaLabel')}</Tooltip>
          </TooltipTrigger>
        </Flex>
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
