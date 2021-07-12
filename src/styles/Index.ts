import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  html {
    -webkit-app-region: drag;
    height: 100%;
    overflow: hidden;
  }
  body {
    height: 100%;
    overflow: hidden;
    margin: 0;
    padding: 0
  }
  #root {
    height: 100%;
    width: 100%;
  }
`;
