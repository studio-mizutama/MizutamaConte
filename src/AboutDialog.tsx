import React, { useEffect, useState } from 'react';
import { DialogContainer, Dialog, Heading, Content, Divider, Text, Flex, ButtonGroup, Button, View } from '@adobe/react-spectrum';
import { useT } from 'i18n';

/** アプリ情報ダイアログ。アプリ名・バージョン（+短縮 SHA）・著作権・同梱ライセンス表記を表示する。
 *  ライセンスは public の third-party-notices.txt を相対パスで取得（Web の /MizutamaConte/ と Electron の file:// 双方に対応）。
 *  ファイルが無い場合は about.licenses.empty にフォールバックする。 */
export const AboutDialog: React.FC<{ isOpen: boolean; onOpenChange: (v: boolean) => void }> = ({ isOpen, onOpenChange }) => {
  const t = useT();
  const [notices, setNotices] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    fetch('./third-party-notices.txt')
      .then((r) => (r.ok ? r.text() : ''))
      .then(setNotices)
      .catch(() => setNotices(''));
  }, [isOpen]);

  return (
    <DialogContainer onDismiss={() => onOpenChange(false)}>
      {isOpen && (
        <Dialog size="M">
          <Heading>Mizutama Conte</Heading>
          <Divider />
          <Content>
            <Flex direction="column" gap="size-100">
              <Text>{`Version ${__APP_VERSION__} (${__BUILD_SHA__})`}</Text>
              <Text>© 2021 Studio Mizutama Association Inc.</Text>
              <Heading level={4}>{t('about.tab.licenses')}</Heading>
              <View
                UNSAFE_style={{ maxHeight: 280, overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: 11, fontFamily: 'monospace' }}
                backgroundColor="gray-50"
                padding="size-100"
                borderRadius="medium"
              >
                {notices || t('about.licenses.empty')}
              </View>
            </Flex>
          </Content>
          <ButtonGroup>
            <Button variant="cta" onPress={() => onOpenChange(false)}>
              {t('about.close')}
            </Button>
          </ButtonGroup>
        </Dialog>
      )}
    </DialogContainer>
  );
};
