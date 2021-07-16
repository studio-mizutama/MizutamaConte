import { FC } from 'react';
import { Grid, Provider, defaultTheme } from '@adobe/react-spectrum';
import { GlobalStyle } from 'styles/Index';
import styled from 'styled-components';
import { ToolGroup } from 'ToolGroup';
import { Header } from 'Header';

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
`;

const GlobalGrid: FC = ({ children }) => (
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

const App: FC = () => {
  return (
    <GlobalGrid>
      <ToolArea gridArea="header">
        <Header />
      </ToolArea>
      <ToolArea gridArea="toolbar">
        <ToolGroup />
      </ToolArea>
      <ToolArea gridArea="sidebar" />
    </GlobalGrid>
  );
};

export default App;
