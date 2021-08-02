import React, { useGlobal } from 'reactn';
import { Grid, Provider, defaultTheme, View } from '@adobe/react-spectrum';
import { GlobalStyle } from 'styles/Index';
import styled from 'styled-components';
import { ToolGroup } from 'ToolGroup';
import { Header } from 'Header';
import { Panels } from 'Panels';
import { Conte } from 'Conte';
import { Preview } from 'Preview';

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

const GlobalGrid: React.FC = ({ children }) => (
  <Provider theme={defaultTheme}>
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

const App: React.FC = () => {
  const mode = useGlobal('mode')[0];
  return (
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
    </GlobalGrid>
  );
};

export default App;
