import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './App';
import { parseRoute } from './route';

// build: base=/MizutamaConte/docs/、dev: base=/
const base = import.meta.env.BASE_URL;
const route = parseRoute(window.location.pathname, base);
const el = document.getElementById('root') as HTMLElement;
const tree = <App route={route} base={base} />;

// prerender 済み DOM があれば hydrate、無ければ（dev = 空 root）render。
if (el.hasChildNodes()) ReactDOM.hydrate(tree, el);
else ReactDOM.render(tree, el);
