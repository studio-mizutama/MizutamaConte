import React, { useState, useEffect } from 'reactn';
import { Button, Content, Divider, Flex, Heading, Text, TextField } from '@adobe/react-spectrum';
import { GitDetect, GitLogEntry, gitReady } from 'git/types';
import { GitHelpPopover } from 'git/GitHelpPopover';
import { useT } from 'i18n';

/** YYYY-MM-DD HH:mm 形式のローカルタイムスタンプ（空メッセージ時の既定 commit メッセージ用）。 */
const snapshotTimestamp = (d: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Branch2 popover の中身。3 状態（未インストール/未init/init済）を出し分ける。
 * Electron 限定で呼ばれる（呼び出し側で window.api?.git をガード）。
 */
export const GitSnapshotPopover: React.FC<{ gitDetect: GitDetect }> = ({ gitDetect }) => {
  const t = useT();
  const ready = gitReady(gitDetect);
  const [isRepo, setIsRepo] = useState<boolean | null>(null);
  const [dirty, setDirty] = useState(false);
  const [latest, setLatest] = useState<GitLogEntry | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const loadState = async () => {
    const git = window.api?.git;
    if (!git || !ready) return;
    const repo = await git.isRepo();
    setIsRepo(repo);
    if (repo) {
      const [st, log] = await Promise.all([git.status(), git.logLatest()]);
      setDirty(st.dirty);
      setLatest(log);
    }
  };

  useEffect(() => {
    loadState();
    // gitDetect は不変、初回のみ読み込む
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const init = async () => {
    const git = window.api?.git;
    if (!git) return;
    setBusy(true);
    try {
      await git.init();
      await loadState();
    } catch (err) {
      alert(err);
    } finally {
      setBusy(false);
    }
  };

  const snapshot = async () => {
    const git = window.api?.git;
    if (!git) return;
    setBusy(true);
    try {
      const msg = message.trim() || `snapshot ${snapshotTimestamp()}`;
      await git.commit(msg);
      setMessage('');
      setDone(true);
      window.setTimeout(() => setDone(false), 1500);
      await loadState();
    } catch (err) {
      alert(err);
    } finally {
      setBusy(false);
    }
  };

  // 未インストール
  if (!ready) {
    return (
      <>
        <Heading>{t('git.snapshot.heading')}</Heading>
        <Divider />
        <Content>
          <Flex direction="row" gap="size-100" alignItems="center">
            <Text>{t('git.help.uninstalled.heading')}</Text>
            <GitHelpPopover platform={gitDetect.platform} />
          </Flex>
        </Content>
      </>
    );
  }

  // 未 init
  if (isRepo === false) {
    return (
      <>
        <Heading>{t('git.snapshot.heading')}</Heading>
        <Divider />
        <Content>
          <Flex direction="column" gap="size-150">
            <Text>{t('git.init.notRepo')}</Text>
            <Button variant="cta" isDisabled={busy} onPress={init}>
              {busy ? t('git.init.starting') : t('git.init.start')}
            </Button>
          </Flex>
        </Content>
      </>
    );
  }

  // init 済（isRepo === null の読込中も同レイアウトで支障なし）
  return (
    <>
      <Heading>{t('git.snapshot.heading')}</Heading>
      <Divider />
      <Content>
        <Flex direction="column" gap="size-150">
          <Text UNSAFE_style={{ fontSize: '12px', opacity: 0.7 }}>
            {latest ? t('git.snapshot.lastSnapshot', { time: snapshotTimestamp(new Date(latest.date)) }) : t('git.snapshot.never')}
            {' · '}
            {dirty ? t('git.snapshot.dirty') : t('git.snapshot.clean')}
          </Text>
          <TextField
            label={t('git.snapshot.messageLabel')}
            value={message}
            onChange={setMessage}
            placeholder={t('git.snapshot.messagePlaceholder', { time: snapshotTimestamp() })}
            width="100%"
          />
          <Flex direction="row" gap="size-100" alignItems="center">
            <Button variant="cta" isDisabled={busy || !dirty} onPress={snapshot}>
              {busy ? t('git.snapshot.creating') : t('git.snapshot.create')}
            </Button>
            {done ? <Text>{t('git.snapshot.done')}</Text> : <></>}
          </Flex>
          <Text UNSAFE_style={{ opacity: 0.6, fontSize: '11px' }}>{t('git.snapshot.cliNote')}</Text>
        </Flex>
      </Content>
    </>
  );
};
