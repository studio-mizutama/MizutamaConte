import React, { useGlobal, useEffect } from 'reactn';
import { Grid, Provider, defaultTheme, View } from '@adobe/react-spectrum';
import { localeTag } from 'i18n';
import { GlobalStyle } from 'styles/Index';
import styled from 'styled-components';
import { ToolGroup } from 'ToolGroup';
import { Header } from 'Header';
import { Panels } from 'Panels';
import { Conte } from 'Conte';
import { Preview } from 'Preview';
import { PrintHost } from 'PrintHost';
import { VideoExportHost } from 'VideoExportHost';
import { PrintStyle } from 'styles/PrintStyle';
import { useUndoRedo } from 'hooks/useUndoRedo';

const BackGround = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
  background-color: var(--spectrum-alias-appframe-border-color);
`;

const ToolArea = styled.div<{ gridArea: string }>`
  background-color: var(--spectrum-alias-toolbar-background-color);
  grid-area: ${({ gridArea }) => gridArea};
  height: 100%;
  overflow: hidden;
`;

const GlobalGrid: React.FC = ({ children }) => {
  const locale = useGlobal('locale')[0];
  const colorScheme = useGlobal('colorScheme')[0];
  return (
    <Provider
      theme={defaultTheme}
      locale={localeTag(locale)}
      colorScheme={colorScheme === 'system' ? undefined : colorScheme}
    >
      <GlobalStyle />
    <BackGround>
      <Grid
        areas={['header header header', 'toolbar content sidebar']}
        columns={['size-600', 'auto', 'size-3600']}
        rows={['size-500', 'auto']}
        height="100vh"
        gap="size-25"
      >
        {children}
      </Grid>
    </BackGround>
    </Provider>
  );
};

const App: React.FC = () => {
  const mode = useGlobal('mode')[0];
  useUndoRedo();

  // 一発アクションのボタン/アイコンは押下後にフォーカスを残さない。フォーカスを保持すると
  // react-aria が Space/Enter を stopPropagation で消費し、Preview のショートカット等が効かなくなるため。
  // 機能上フォーカスが必要なもの＝テキスト入力(input/textarea)・スライダー・オーバーレイのトリガ
  // (aria-haspopup) とオーバーレイ内(dialog/menu/listbox/grid)は除外する（矢印選択/Esc/フォーカストラップ）。
  // マウスホバー(Tooltip 等)はフォーカスと無関係なので影響しない。
  useEffect(() => {
    const onPointerUp = () => {
      // press 処理でフォーカスが確定した後に判定するため次フレームへ送る
      requestAnimationFrame(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return;
        const isButton = el.tagName === 'BUTTON' || el.getAttribute('role') === 'button';
        if (!isButton) return;
        if (el.getAttribute('aria-haspopup') || el.getAttribute('aria-expanded') === 'true') return;
        if (el.closest('[role="dialog"],[role="alertdialog"],[role="menu"],[role="listbox"],[role="grid"]')) return;
        el.blur();
      });
    };
    document.addEventListener('pointerup', onPointerUp);
    return () => document.removeEventListener('pointerup', onPointerUp);
  }, []);

  return (
    <>
      <PrintStyle />
      <GlobalGrid>
        <ToolArea gridArea="header">
          <Header />
        </ToolArea>
        <ToolArea gridArea="toolbar">
          <ToolGroup />
        </ToolArea>
        <ToolArea gridArea="sidebar">
          <Panels />
        </ToolArea>
        <View gridArea="content">
          <div style={{ display: `${mode === 'Edit' ? 'block' : 'none'}` }}>
            <Conte />
          </div>
          <div style={{ display: `${mode === 'Preview' ? 'block' : 'none'}`, height: '100%' }}>
            <Preview />
          </div>
        </View>
        {/* react-spectrum の Dialog を使うため Provider(GlobalGrid) の内側に置く。
            PrintHost は createPortal + 素の HTML なので Provider 外でよい。 */}
        <VideoExportHost />
      </GlobalGrid>
      <PrintHost />
    </>
  );
};

export default App;
