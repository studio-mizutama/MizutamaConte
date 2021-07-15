import React from 'react';
import { Grid, Provider, defaultTheme } from '@adobe/react-spectrum';
import { GlobalStyle } from 'styles/Index';
import styled from 'styled-components';

const BackGround = styled.div`
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: var(--spectrum-alias-appframe-border-color);
`;

const ToolArea = styled.div<{ gridArea: string }>`
  background-color: var(--spectrum-alias-toolbar-background-color);
  grid-area: ${({ gridArea }) => gridArea};
  -webkit-app-region: drag;
`;

function App() {
  return (
    <Provider theme={defaultTheme}>
      <GlobalStyle />
      <BackGround>
        <Grid
          areas={['header header header', 'toolbar content sidebar']}
          columns={['size-600', 'auto', 'size-3600']}
          rows={['size-600', 'auto']}
          height="100vh"
          gap="size-25"
        >
          <ToolArea gridArea="header" />
          <ToolArea gridArea="toolbar" />
          <ToolArea gridArea="sidebar" />
        </Grid>
      </BackGround>
    </Provider>
  );
}

export default App;
