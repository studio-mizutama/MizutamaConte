import React, { setGlobal } from 'reactn';
import ReactDOM from 'react-dom';
import App from 'App';
import { emptyProject } from 'project/load';

setGlobal({
  mode: 'Edit',
  tool: new Set(['Select']),
  cut: {},
  project: emptyProject(),
  psdCache: {},
  globalFileName: '',
  isLoading: false,
  saveState: 'idle',
});

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
);
