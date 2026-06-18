import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Provider, defaultTheme } from '@adobe/react-spectrum';
import { DocsApp } from './DocsApp';
import { Landing } from './Landing';
import './theme.css';

// ホーム(#/ or 空) はランディング、それ以外(#/usage 等)はドキュメント。
const isHome = (): boolean => {
  const h = window.location.hash.replace(/^#\/?/, '');
  return h === '' || h === 'home';
};

const Root: React.FC = () => {
  const [home, setHome] = useState<boolean>(isHome());
  useEffect(() => {
    const on = () => setHome(isHome());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return home ? <Landing /> : <DocsApp />;
};

ReactDOM.render(
  // ライト基調に固定（ダークは設定切替デモのスクショでのみ見せる方針）
  <Provider theme={defaultTheme} colorScheme="light">
    <Root />
  </Provider>,
  document.getElementById('root'),
);
