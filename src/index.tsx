import React, { setGlobal } from 'reactn';
import ReactDOM from 'react-dom';
import App from 'App';
import reportWebVitals from 'reportWebVitals';
import { Psd } from 'ag-psd';

const prtPsd: Psd = { width: 1, height: 1 };
const prtCut: Cut = {
  picture: prtPsd,
};

setGlobal({ mode: 'Edit', tool: new Set(['Select']), cut: prtCut });

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
