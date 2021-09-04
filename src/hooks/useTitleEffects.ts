import { useEffect } from 'react';
const { api } = window;

export const useTitleEffects = (
  setMaximized: React.Dispatch<React.SetStateAction<boolean>>,
  setBlur: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  useEffect(() => {
    api && api.resized(async () => setMaximized(false));

    return () => {
      api && api.removeResized();
    };
  }, [setMaximized]);

  useEffect(() => {
    api && api.getFocus(async () => setBlur(false));

    return () => {
      api && api.removeGetFocus();
    };
  }, [setBlur]);

  useEffect(() => {
    api && api.getBlur(async () => setBlur(true));

    return () => {
      api && api.removeGetBlur();
    };
  });

  useEffect(() => {
    api && api.maximized(async () => setMaximized(true));

    return () => {
      api && api.removeMaximized();
    };
  }, [setMaximized]);

  useEffect(() => {
    api && api.unMaximized(async () => setMaximized(false));

    return () => {
      api && api.removeUnMaximized();
    };
  }, [setMaximized]);
};
