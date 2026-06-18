import React, { useState, useGlobal, useEffect } from 'reactn';
import {
  Button,
  ButtonGroup,
  Checkbox,
  Content,
  Dialog,
  DialogContainer,
  Divider,
  Flex,
  Heading,
  Item,
  Picker,
  Text,
  TextField,
} from '@adobe/react-spectrum';
import { useProject } from 'hooks/useProject';
import { getStorage } from 'storage';
import { emptyProject } from 'project/load';
import { serializeProject, setLastPersisted, setPendingV1Backup } from 'project/save';
import { ASPECT_KEYS, RESOLUTION_KEYS, deriveFrame } from 'project/dimensions';
import { AspectKey, ResolutionKey, ProjectFile, PsdCache } from 'project/types';
import { buildProjectFromScript } from 'project/scriptProject';
import { useT } from 'i18n';
import { gitReady } from 'git/types';
import { GitHelpPopover } from 'git/GitHelpPopover';
import { clearHistory } from 'history/undoManager';
import { setSharedDirPath } from 'hooks/useOpenFolder';

const FPS_OPTIONS = ['12', '24', '30'];

/** 新規プロジェクト作成ダイアログ。開閉は global newProjectOpen で制御し、
 *  メニュー(Electron) / ハンバーガー(Web) から開く。ボタンは内包しない。 */
export const NewProjectDialog: React.FC = () => {
  const t = useT();
  const { setProject } = useProject();
  const setPsdCache = useGlobal('psdCache')[1];
  const setFileName = useGlobal('globalFileName')[1];
  const setSaveState = useGlobal('saveState')[1];
  const [open, setOpen] = useGlobal('newProjectOpen');
  const [scriptImport, setScriptImport] = useGlobal('scriptImport');
  const storage = getStorage();

  const [title, setTitle] = useState('NewConte');
  const [resolution, setResolution] = useState<ResolutionKey>('FHD');
  const [aspect, setAspect] = useState<AspectKey>('16:9');
  const [fps, setFps] = useState('24');
  const [gitEnabled, setGitEnabled] = useState(false);
  const gitDetect = useGlobal('gitDetect')[0];
  const gitIsReady = gitReady(gitDetect);

  // Electron: メニュー File > New からダイアログを開く
  useEffect(() => {
    const api = window.api;
    if (!api) return;
    const listener = () => setOpen(true);
    api.onNewProjectRequest(listener);
    return () => api.removeNewProjectRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 「脚本から新規」で開いたとき、作品名をタイトル欄に流し込む
  useEffect(() => {
    if (open && scriptImport) setTitle(scriptImport.title || 'NewConte');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, scriptImport]);

  const create = async () => {
    // 名前はここで決定。保存先フォルダのみネイティブ/FSA で選ぶ（名前の二重入力なし）
    const created = await storage.createProject(title.trim() || 'NewConte');
    if (!created) return;
    // Electron: 作成フォルダの絶対パスをレンダラの再読込 ref に反映し、New 直後でも
    // View→Reload / 外部編集の自動再読込を有効化する（Web は getCurrentDirHandle() が非null なので不要）。
    if (created.dirPath) setSharedDirPath(created.dirPath);
    const settings = {
      resolution,
      aspect,
      frame: deriveFrame(resolution, aspect),
      fps: Number(fps),
    };
    let project: ProjectFile;
    let cache: PsdCache = {};
    let psdFiles: { name: string; buffer: Uint8Array }[] = [];
    if (scriptImport) {
      // 脚本モード: 先に全カット+空PSDをメモリ構築（createProject 後にまとめて書き込む）
      const built = buildProjectFromScript(scriptImport, settings);
      project = { ...built.project, title: created.name };
      cache = built.cache;
      psdFiles = built.psdFiles;
    } else {
      project = emptyProject(created.name);
      project.settings = settings;
    }
    const jsonFileName = `${created.name}.json`;
    const text = serializeProject(project);
    try {
      for (const f of psdFiles) {
        await storage.writeFile(f.name, f.buffer);
      }
      await storage.writeFile(jsonFileName, text);
      setLastPersisted(text);
      setPendingV1Backup(null);
      setProject(project);
      setPsdCache(cache);
      setFileName(jsonFileName);
      setSaveState('saved');
      clearHistory();
      getStorage().purgeTrash().catch(() => undefined);
      // バージョン管理 ON かつ Electron かつ git 検出済みのときだけ init（.gitignore/.gitattributes/LFS/初期コミットは electron/git.ts が実施）
      if (gitEnabled && gitIsReady && window.api?.git) {
        try {
          await window.api.git.init();
        } catch (gitErr) {
          alert(gitErr);
        }
      }
      setScriptImport(null);
      setOpen(false);
    } catch (err) {
      alert(err);
    }
  };

  if (!storage.capabilities.write) return null;

  return (
    <DialogContainer
      onDismiss={() => {
        setOpen(false);
        setScriptImport(null);
      }}
    >
      {open && (
        <Dialog size="S">
          <Heading>{scriptImport ? t('newProject.fromScriptTitle') : t('newProject.title')}</Heading>
          <Divider />
          <Content>
            <Flex direction="column" gap="size-150">
              <TextField label={t('newProject.titleLabel')} value={title} onChange={setTitle} autoFocus width="100%" />
              <Flex direction="row" gap="size-150">
                <Picker
                  label={t('newProject.resolutionLabel')}
                  selectedKey={resolution}
                  onSelectionChange={(key) => setResolution(key as ResolutionKey)}
                >
                  {RESOLUTION_KEYS.map((key) => (
                    <Item key={key}>{key}</Item>
                  ))}
                </Picker>
                <Picker
                  label={t('newProject.aspectLabel')}
                  selectedKey={aspect}
                  onSelectionChange={(key) => setAspect(key as AspectKey)}
                >
                  {ASPECT_KEYS.map((key) => (
                    <Item key={key}>{key}</Item>
                  ))}
                </Picker>
                <Picker label="fps" selectedKey={fps} onSelectionChange={(key) => setFps(key as string)}>
                  {FPS_OPTIONS.map((key) => (
                    <Item key={key} textValue={key}>
                      <Text>{key}</Text>
                    </Item>
                  ))}
                </Picker>
              </Flex>
              {gitDetect ? (
                <Flex direction="row" gap="size-100" alignItems="center">
                  <Checkbox isSelected={gitEnabled} isDisabled={!gitIsReady} onChange={setGitEnabled}>
                    {t('git.enableLabel')}
                  </Checkbox>
                  {!gitIsReady ? <GitHelpPopover platform={gitDetect.platform} /> : <></>}
                </Flex>
              ) : (
                <></>
              )}
            </Flex>
          </Content>
          <ButtonGroup>
            <Button
              variant="secondary"
              onPress={() => {
                setOpen(false);
                setScriptImport(null);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button variant="cta" onPress={create}>
              {t('newProject.create')}
            </Button>
          </ButtonGroup>
        </Dialog>
      )}
    </DialogContainer>
  );
};
