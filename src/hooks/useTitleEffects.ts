import { useEffect } from 'react';
const { api } = window;

export const useTitleEffects = (
  setMaximized: React.Dispatch<React.SetStateAction<boolean>>,
  setBlur: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  useEffect(() => {
    window.navigator.userAgent.toLowerCase().indexOf('mac') === -1 &&
      api &&
      api.resized(async () => setMaximized(false));

    return () => {
      window.navigator.userAgent.toLowerCase().indexOf('mac') === -1 && api && api.removeResized();
    };
  }, [setMaximized]);

  useEffect(() => {
    window.navigator.userAgent.toLowerCase().indexOf('mac') === -1 && api && api.getFocus(async () => setBlur(false));

    return () => {
      window.navigator.userAgent.toLowerCase().indexOf('mac') === -1 && api && api.removeGetFocus();
    };
  }, [setBlur]);

  useEffect(() => {
    window.navigator.userAgent.toLowerCase().indexOf('mac') === -1 && api && api.getBlur(async () => setBlur(true));

    return () => {
      window.navigator.userAgent.toLowerCase().indexOf('mac') === -1 && api && api.removeGetBlur();
    };
  });

  useEffect(() => {
    window.navigator.userAgent.toLowerCase().indexOf('mac') === -1 &&
      api &&
      api.maximized(async () => setMaximized(true));

    return () => {
      window.navigator.userAgent.toLowerCase().indexOf('mac') === -1 && api && api.removeMaximized();
    };
  }, [setMaximized]);

  useEffect(() => {
    window.navigator.userAgent.toLowerCase().indexOf('mac') === -1 &&
      api &&
      api.unMaximized(async () => setMaximized(false));

    return () => {
      window.navigator.userAgent.toLowerCase().indexOf('mac') === -1 && api && api.removeUnMaximized();
    };
  }, [setMaximized]);
};
