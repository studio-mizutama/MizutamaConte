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
import { AppSettings } from 'project/types';

const api = window.api;

/** 歯車から開く設定ダイアログ。Project は確認用（読み取り専用）、お絵描きアプリは編集可（Electron のみ）。 */
export const SettingsDialog: React.FC = () => {
  const [open, setOpen] = useGlobal('settingsOpen');
  const { settings } = useProject();
  const [mode, setMode] = useState<'auto' | 'custom'>('auto');
  const [customPath, setCustomPath] = useState('');
  const [detected, setDetected] = useState<string | null>(null);

  // 開くたびに現在の設定を読み込む（Electron のみ）
  useEffect(() => {
    if (!open || !api) return;
    api.loadSettings().then((s: AppSettings) => {
      setMode(s.paintApp?.mode ?? 'auto');
      setCustomPath(s.paintApp?.customPath ?? '');
    });
    setDetected(null);
  }, [open]);

  const browse = async () => {
    if (!api) return;
    const p = await api.selectPaintAppPath();
    if (p) setCustomPath(p);
  };

  const detect = async () => {
    if (!api) return;
    const found = await api.detectPaintApp();
    setDetected(found ? found.path : 'なし（OS既定アプリで開きます）');
  };

  const save = async () => {
    if (api) {
      try {
        await api.saveSettings({ paintApp: { mode, customPath: customPath || undefined } });
      } catch (err) {
        alert(err);
        return;
      }
    }
    setOpen(false);
  };

  return (
    <DialogContainer onDismiss={() => setOpen(false)}>
      {open && (
        <Dialog size="M">
          <Heading>設定</Heading>
          <Divider />
          <Content>
            <Flex direction="column" gap="size-300">
              <Flex direction="column" gap="size-100">
                <Heading level={4} margin={0}>
                  プロジェクト
                </Heading>
                <Text>
                  解像度: {settings.resolution} ／ アスペクト比: {settings.aspect}
                </Text>
                <Text>
                  フレーム: {settings.frame.width} × {settings.frame.height} ／ fps: {settings.fps}
                </Text>
                <Text UNSAFE_style={{ opacity: 0.6, fontSize: '12px' }}>
                  ※ 解像度・アスペクト比は新規作成時に指定します（既存プロジェクトでは変更できません）
                </Text>
              </Flex>

              {api && (
                <Flex direction="column" gap="size-150">
                  <Heading level={4} margin={0}>
                    お絵描きアプリ
                  </Heading>
                  <Picker label="起動方法" selectedKey={mode} onSelectionChange={(k) => setMode(k as 'auto' | 'custom')}>
                    <Item key="auto">自動（インストール済みを検出）</Item>
                    <Item key="custom">手動指定</Item>
                  </Picker>
                  {mode === 'custom' ? (
                    <Flex direction="row" gap="size-100" alignItems="end">
                      <TextField label="アプリのパス" value={customPath} onChange={setCustomPath} width="100%" />
                      <Button variant="secondary" onPress={browse}>
                        参照…
                      </Button>
                    </Flex>
                  ) : (
                    <></>
                  )}
                  <Flex direction="row" gap="size-100" alignItems="center">
                    <Button variant="secondary" onPress={detect}>
                      インストール済みを検出
                    </Button>
                    {detected ? <Text>{detected}</Text> : <></>}
                  </Flex>
                </Flex>
              )}
            </Flex>
          </Content>
          <ButtonGroup>
            <Button variant="secondary" onPress={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button variant="cta" onPress={save}>
              保存
            </Button>
          </ButtonGroup>
        </Dialog>
      )}
    </DialogContainer>
  );
};
