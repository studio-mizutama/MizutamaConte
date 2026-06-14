import React, { useState, useGlobal } from 'reactn';
import {
  ActionButton,
  Button,
  ButtonGroup,
  Content,
  Dialog,
  DialogTrigger,
  Divider,
  Flex,
  Heading,
  Item,
  Picker,
  Text,
  TextField,
} from '@adobe/react-spectrum';
import NewItem from '@spectrum-icons/workflow/NewItem';
import { useProject } from 'hooks/useProject';
import { getStorage } from 'storage';
import { emptyProject } from 'project/load';
import { serializeProject, setLastPersisted, setPendingV1Backup } from 'project/save';
import { ASPECT_KEYS, RESOLUTION_KEYS, deriveFrame } from 'project/dimensions';
import { AspectKey, ResolutionKey } from 'project/types';

const FPS_OPTIONS = ['12', '24', '30'];

/** 新規プロジェクト作成ダイアログ（タイトル・アスペクト比・解像度・fps） */
export const NewProjectDialog: React.FC = () => {
  const { setProject } = useProject();
  const setPsdCache = useGlobal('psdCache')[1];
  const setFileName = useGlobal('globalFileName')[1];
  const setSaveState = useGlobal('saveState')[1];
  const storage = getStorage();

  const [title, setTitle] = useState('NewConte');
  const [resolution, setResolution] = useState<ResolutionKey>('FHD');
  const [aspect, setAspect] = useState<AspectKey>('16:9');
  const [fps, setFps] = useState('24');

  if (!storage.capabilities.write) return null;

  const create = async (close: () => void) => {
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
      close();
    } catch (err) {
      alert(err);
    }
  };

  return (
    <DialogTrigger>
      <ActionButton isQuiet aria-label="New Project">
        <NewItem />
      </ActionButton>
      {(close) => (
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
                <Picker
                  label="アスペクト比"
                  selectedKey={aspect}
                  onSelectionChange={(key) => setAspect(key as AspectKey)}
                >
                  {ASPECT_KEYS.map((key) => (
                    <Item key={key}>{key}</Item>
                  ))}
                </Picker>
                <Picker
                  label="fps"
                  selectedKey={fps}
                  onSelectionChange={(key) => setFps(key as string)}
                  width="size-1200"
                  menuWidth="size-1000"
                >
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
            <Button variant="secondary" onPress={close}>
              キャンセル
            </Button>
            <Button variant="cta" onPress={() => create(close)}>
              作成
            </Button>
          </ButtonGroup>
        </Dialog>
      )}
    </DialogTrigger>
  );
};
