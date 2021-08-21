import { useEffect } from 'react';
const { api } = window;

export const useTitleEffects = (
  setMaximized: React.Dispatch<React.SetStateAction<boolean>>,
  setBlur: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  useEffect(() => {
    api.resized(async () => setMaximized(false));

    return () => {
      api.removeResized();
    };
  }, [setMaximized]);

  useEffect(() => {
    api.getFocus(async () => setBlur(false));

    return () => {
      api.removeGetFocus();
    };
  }, [setBlur]);

  useEffect(() => {
    api.getBlur(async () => setBlur(true));

    return () => {
      api.removeGetBlur();
    };
  });

  useEffect(() => {
    api.maximized(async () => setMaximized(true));

    return () => {
      api.removeMaximized();
    };
  }, [setMaximized]);

  useEffect(() => {
    api.unMaximized(async () => setMaximized(false));

    return () => {
      api.removeUnMaximized();
    };
  }, [setMaximized]);
};
