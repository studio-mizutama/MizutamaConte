import React, { setGlobal } from 'reactn';
import { Flex, Heading, Text, ButtonGroup, Button } from '@adobe/react-spectrum';
import { useT } from 'i18n';
import { emptyProject } from 'project/load';

/** content 領域 ErrorBoundary の復帰 UI。再読込 or 新規プロジェクトへ戻して詰まないようにする。 */
export const ErrorFallback: React.FC<{ reset: () => void }> = ({ reset }) => {
  const t = useT();
  const goHome = (): void => {
    // 壊れた project を捨てて安全な初期状態へ戻し、境界の error state もリセットして再描画する
    setGlobal({
      project: emptyProject(),
      psdCache: {},
      globalFileName: '',
      selectedCutIndex: 0,
      currentCutIndex: 0,
      cut: {},
      loadError: null,
    });
    reset();
  };
  return (
    <Flex direction="column" alignItems="center" justifyContent="center" height="100vh" gap="size-200">
      <Heading level={3}>{t('error.render.title')}</Heading>
      <Text>{t('error.render.body')}</Text>
      <ButtonGroup>
        <Button variant="secondary" onPress={() => window.location.reload()}>
          {t('error.render.reload')}
        </Button>
        {/* goHome は setGlobal で空プロジェクトへ戻す＝再読込が効かない環境でも確実に復帰できる主導線 */}
        <Button variant="cta" onPress={goHome}>
          {t('error.render.home')}
        </Button>
      </ButtonGroup>
    </Flex>
  );
};
