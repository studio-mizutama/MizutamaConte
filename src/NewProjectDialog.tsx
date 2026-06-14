import React, { useState, useGlobal, useEffect } from 'reactn';
import {
  Button,
  ButtonGroup,
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
import { AspectKey, ResolutionKey } from 'project/types';

const FPS_OPTIONS = ['12', '24', '30'];

/** 新規プロジェクト作成ダイアログ。開閉は global newProjectOpen で制御し、
 *  メニュー(Electron) / ハンバーガー(Web) から開く。ボタンは内包しない。 */
export const NewProjectDialog: React.FC = () => {
  const { setProject } = useProject();
  const setPsdCache = useGlobal('psdCache')[1];
  const setFileName = useGlobal('globalFileName')[1];
  const setSaveState = useGlobal('saveState')[1];
  const [open, setOpen] = useGlobal('newProjectOpen');
  const storage = getStorage();

  const [title, setTitle] = useState('NewConte');
  const [resolution, setResolution] = useState<ResolutionKey>('FHD');
  const [aspect, setAspect] = useState<AspectKey>('16:9');
  const [fps, setFps] = useState('24');

  // Electron: メニュー File > New からダイアログを開く
  useEffect(() => {
    const api = window.api;
    if (!api) return;
    const listener = () => setOpen(true);
    api.onNewProjectRequest(listener);
    return () => api.removeNewProjectRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async () => {
    // 名前はここで決定。保存先フォルダのみネイティブ/FSA で選ぶ（名前の二重入力なし）
    const created = await storage.createProject(title.trim() || 'NewConte');
    if (!created) return;
    const project = emptyProject(created.name);
    project.settings = {
      resolution,
      aspect,
      frame: deriveFrame(resolution, aspect),
      fps: Number(fps),
    };
    const jsonFileName = `${created.name}.json`;
    const text = serializeProject(project);
    try {
      await storage.writeFile(jsonFileName, text);
      setLastPersisted(text);
      setPendingV1Backup(null);
      setProject(project);
      setPsdCache({});
      setFileName(jsonFileName);
      setSaveState('saved');
      setOpen(false);
    } catch (err) {
      alert(err);
    }
  };

  if (!storage.capabilities.write) return null;

  return (
    <DialogContainer onDismiss={() => setOpen(false)}>
      {open && (
        <Dialog size="S">
          <Heading>新規プロジェクト</Heading>
          <Divider />
          <Content>
            <Flex direction="column" gap="size-150">
              <TextField label="タイトル" value={title} onChange={setTitle} autoFocus width="100%" />
              <Flex direction="row" gap="size-150">
                <Picker
                  label="解像度"
                  selectedKey={resolution}
                  onSelectionChange={(key) => setResolution(key as ResolutionKey)}
                >
                  {RESOLUTION_KEYS.map((key) => (
                    <Item key={key}>{key}</Item>
                  ))}
                </Picker>
                <Picker label="アスペクト比" selectedKey={aspect} onSelectionChange={(key) => setAspect(key as AspectKey)}>
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
            </Flex>
          </Content>
          <ButtonGroup>
            <Button variant="secondary" onPress={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button variant="cta" onPress={create}>
              作成
            </Button>
          </ButtonGroup>
        </Dialog>
      )}
    </DialogContainer>
  );
};
