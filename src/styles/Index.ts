import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  html {
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
    overflow: hidden;
  }
  button {
    -webkit-app-region: no-drag;
  }
  div.hover {
   :hover {
     background-color: var(--spectrum-alias-highlight-hover);
   }
  }
  textarea.hover {
    :hover {
      color: var(--spectrum-alias-text-color-hover);
      border: 1px solid var(--spectrum-alias-border-color-hover);
      border-radius: var(--spectrum-global-dimension-size-50, var(--spectrum-alias-size-50));
    }
  }
`;
