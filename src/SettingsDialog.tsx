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
import { saveAppSettings } from 'settings/appSettings';
import { useT, LOCALES, LANGUAGE_LABELS, Locale, ColorScheme } from 'i18n';
import { GitDetect } from 'git/types';
import { GitHelpPopover } from 'git/GitHelpPopover';

const api = window.api;

/** 歯車から開く設定ダイアログ。表示（言語・テーマ）は全環境、Project は確認用（読み取り専用）、
 *  お絵描きアプリは編集可（Electron のみ）。 */
export const SettingsDialog: React.FC = () => {
  const t = useT();
  const [open, setOpen] = useGlobal('settingsOpen');
  const [locale, setLocale] = useGlobal('locale');
  const [colorScheme, setColorScheme] = useGlobal('colorScheme');
  const { settings } = useProject();
  const [langDraft, setLangDraft] = useState<Locale>(locale);
  const [themeDraft, setThemeDraft] = useState<ColorScheme>(colorScheme);
  const [mode, setMode] = useState<'auto' | 'custom'>('auto');
  const [customPath, setCustomPath] = useState('');
  const [detected, setDetected] = useState<string | null>(null);
  const gitDetect = useGlobal('gitDetect')[0] as GitDetect | undefined;
  const [gitIsRepo, setGitIsRepo] = useState<boolean | null>(null);
  const [gitBusy, setGitBusy] = useState(false);

  // 開くたびに現在の適用値（言語・テーマ）でドラフトを初期化し、paintApp（Electron）を読み込む
  useEffect(() => {
    if (!open) return;
    setLangDraft(locale);
    setThemeDraft(colorScheme);
    if (api) {
      api.loadSettings().then((s: AppSettings) => {
        setMode(s.paintApp?.mode ?? 'auto');
        setCustomPath(s.paintApp?.customPath ?? '');
      });
    }
    setDetected(null);
    if (api?.git && gitDetect?.hasGit && gitDetect?.hasLfs) {
      api.git.isRepo().then(setGitIsRepo);
    } else {
      setGitIsRepo(null);
    }
    // locale/colorScheme は save 時にしか変化しない（その時 open=false になる）ため open のみを依存にする
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const browse = async () => {
    if (!api) return;
    const p = await api.selectPaintAppPath();
    if (p) setCustomPath(p);
  };

  const detect = async () => {
    if (!api) return;
    const found = await api.detectPaintApp();
    setDetected(found ? found.path : t('settings.paintApp.noneDetected'));
  };

  const gitInit = async () => {
    if (!api?.git) return;
    setGitBusy(true);
    try {
      await api.git.init();
      setGitIsRepo(true);
    } catch (err) {
      alert(err);
    } finally {
      setGitBusy(false);
    }
  };

  const save = async () => {
    // 言語・テーマを即適用（Provider が再描画）し、永続化する
    setLocale(langDraft);
    setColorScheme(themeDraft);
    document.documentElement.lang = langDraft;
    try {
      await saveAppSettings({
        language: langDraft,
        theme: themeDraft,
        ...(api ? { paintApp: { mode, customPath: customPath || undefined } } : {}),
      });
      // Electron: ネイティブテーマとメニューをライブ更新
      if (api) await api.applyAppSettings(langDraft, themeDraft);
    } catch (err) {
      alert(err);
      return;
    }
    setOpen(false);
  };

  return (
    <DialogContainer onDismiss={() => setOpen(false)}>
      {open && (
        <Dialog size="M">
          <Heading>{t('settings.title')}</Heading>
          <Divider />
          <Content>
            <Flex direction="column" gap="size-300">
              <Flex direction="column" gap="size-150">
                <Heading level={4} margin={0}>
                  {t('settings.section.appearance')}
                </Heading>
                <Picker
                  label={t('settings.language.label')}
                  selectedKey={langDraft}
                  onSelectionChange={(k) => setLangDraft(k as Locale)}
                >
                  {LOCALES.map((l) => (
                    <Item key={l}>{LANGUAGE_LABELS[l]}</Item>
                  ))}
                </Picker>
                <Picker
                  label={t('settings.theme.label')}
                  selectedKey={themeDraft}
                  onSelectionChange={(k) => setThemeDraft(k as ColorScheme)}
                >
                  <Item key="system">{t('settings.theme.system')}</Item>
                  <Item key="light">{t('settings.theme.light')}</Item>
                  <Item key="dark">{t('settings.theme.dark')}</Item>
                </Picker>
              </Flex>

              <Flex direction="column" gap="size-100">
                <Heading level={4} margin={0}>
                  {t('settings.section.project')}
                </Heading>
                <Text>{t('settings.project.resolutionAspect', { resolution: settings.resolution, aspect: settings.aspect })}</Text>
                <Text>
                  {t('settings.project.frameFps', {
                    width: settings.frame.width,
                    height: settings.frame.height,
                    fps: settings.fps,
                  })}
                </Text>
                <Text UNSAFE_style={{ opacity: 0.6, fontSize: '12px' }}>{t('settings.project.note')}</Text>
              </Flex>

              {api && (
                <Flex direction="column" gap="size-150">
                  <Heading level={4} margin={0}>
                    {t('settings.section.paintApp')}
                  </Heading>
                  <Picker
                    label={t('settings.paintApp.modeLabel')}
                    selectedKey={mode}
                    onSelectionChange={(k) => setMode(k as 'auto' | 'custom')}
                  >
                    <Item key="auto">{t('settings.paintApp.mode.auto')}</Item>
                    <Item key="custom">{t('settings.paintApp.mode.custom')}</Item>
                  </Picker>
                  {mode === 'custom' ? (
                    <Flex direction="row" gap="size-100" alignItems="end">
                      <TextField
                        label={t('settings.paintApp.pathLabel')}
                        value={customPath}
                        onChange={setCustomPath}
                        width="100%"
                      />
                      <Button variant="secondary" onPress={browse}>
                        {t('settings.paintApp.browse')}
                      </Button>
                    </Flex>
                  ) : (
                    <></>
                  )}
                  <Flex direction="row" gap="size-100" alignItems="center">
                    <Button variant="secondary" onPress={detect}>
                      {t('settings.paintApp.detect')}
                    </Button>
                    {detected ? <Text>{detected}</Text> : <></>}
                  </Flex>
                </Flex>
              )}
              {api && gitDetect ? (
                <Flex direction="column" gap="size-150">
                  <Heading level={4} margin={0}>
                    {t('git.snapshot.heading')}
                  </Heading>
                  {!(gitDetect.hasGit && gitDetect.hasLfs) ? (
                    <Flex direction="row" gap="size-100" alignItems="center">
                      <Text>{t('git.help.uninstalled.heading')}</Text>
                      <GitHelpPopover platform={gitDetect.platform} />
                    </Flex>
                  ) : gitIsRepo ? (
                    <Text>{t('git.snapshot.cliNote')}</Text>
                  ) : (
                    <Flex direction="column" gap="size-100">
                      <Text>{t('git.init.notRepo')}</Text>
                      <Button variant="secondary" isDisabled={gitBusy} onPress={gitInit}>
                        {gitBusy ? t('git.init.starting') : t('git.init.start')}
                      </Button>
                    </Flex>
                  )}
                </Flex>
              ) : (
                <></>
              )}
            </Flex>
          </Content>
          <ButtonGroup>
            <Button variant="secondary" onPress={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="cta" onPress={save}>
              {t('common.save')}
            </Button>
          </ButtonGroup>
        </Dialog>
      )}
    </DialogContainer>
  );
};
