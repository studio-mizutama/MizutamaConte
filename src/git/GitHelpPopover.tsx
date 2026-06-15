import React, { useState } from 'reactn';
import { ActionButton, Content, Dialog, DialogTrigger, Divider, Flex, Heading, Text } from '@adobe/react-spectrum';
import HelpIcon from '@spectrum-icons/workflow/Help';
import { installCommands } from 'git/installHelp';
import { useT } from 'i18n';

/** 1 コマンド行（ラベル＋コピーボタン）。押下後しばらく「コピーしました」を表示する。 */
const CommandRow: React.FC<{ label: string; command: string }> = ({ label, command }) => {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // クリップボード不可（権限拒否等）でもアプリは落とさない
    }
  };
  return (
    <Flex direction="column" gap="size-50">
      <Text UNSAFE_style={{ fontSize: '11px', opacity: 0.7 }}>{label}</Text>
      <Flex direction="row" gap="size-100" alignItems="center">
        <Text
          UNSAFE_style={{
            fontFamily: 'monospace',
            fontSize: '12px',
            userSelect: 'all',
            wordBreak: 'break-all',
          }}
        >
          {command}
        </Text>
        <ActionButton isQuiet onPress={copy}>
          {copied ? t('git.help.copied') : t('git.help.copy')}
        </ActionButton>
      </Flex>
    </Flex>
  );
};

/**
 * git/git-lfs 未インストール時の導入ヘルプを "?" ポップオーバーで表示する。
 * react-spectrum 3.11.2 に ContextualHelp が無いため DialogTrigger type="popover" + Help アイコンで等価実装。
 */
export const GitHelpPopover: React.FC<{ platform: string }> = ({ platform }) => {
  const t = useT();
  const cmds = installCommands(platform);
  return (
    <DialogTrigger type="popover">
      <ActionButton isQuiet aria-label={t('git.help.ariaLabel')}>
        <HelpIcon />
      </ActionButton>
      <Dialog size="S">
        <Heading>{t('git.help.uninstalled.heading')}</Heading>
        <Divider />
        <Content>
          <Flex direction="column" gap="size-150">
            {[
              <Text key="body">{t('git.help.uninstalled.body')}</Text>,
              ...cmds.map((c) => <CommandRow key={c.label} label={c.label} command={c.command} />),
              <Text key="restart" UNSAFE_style={{ opacity: 0.6, fontSize: '11px' }}>
                {t('git.help.restartNote')}
              </Text>,
            ]}
          </Flex>
        </Content>
      </Dialog>
    </DialogTrigger>
  );
};
