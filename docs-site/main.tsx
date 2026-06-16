import React from 'react';
import ReactDOM from 'react-dom';
import { Provider, defaultTheme } from '@adobe/react-spectrum';
import { DocsApp } from './DocsApp';

ReactDOM.render(
  <Provider theme={defaultTheme}>
    <DocsApp />
  </Provider>,
  document.getElementById('root'),
);
