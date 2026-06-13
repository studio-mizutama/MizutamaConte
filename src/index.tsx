import React, { setGlobal } from 'reactn';
import ReactDOM from 'react-dom';
import App from 'App';
import { Psd } from 'ag-psd';

const prtPsd: Psd = { width: 1, height: 1 };
const prtCut: Cut = {
  picture: prtPsd,
};

setGlobal({
  mode: 'Edit',
  tool: new Set(['Select']),
  cut: prtCut,
  globalCuts: [prtCut],
  globalPsds: [prtPsd],
  globalFileName: '',
});

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
);
