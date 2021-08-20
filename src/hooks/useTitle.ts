import { useState, useEffect } from 'react';

const { api } = window;

export const useTitle = (
  isMaximized: boolean,
  isBlur: boolean,
): [boolean, React.Dispatch<React.SetStateAction<boolean>>, boolean] => {
  const [maximized, setMaximized] = useState(isMaximized);
  const [blur, setBlur] = useState(isBlur);

  useEffect(() => {
    api.resized(async () => setMaximized(false));

    return () => {
      api.removeResized();
    };
  }, []);

  useEffect(() => {
    api.getFocus(async () => setBlur(false));

    return () => {
      api.removeGetFocus();
    };
  }, [blur]);

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
  }, []);

  useEffect(() => {
    api.unMaximized(async () => setMaximized(false));

    return () => {
      api.removeUnMaximized();
    };
  }, []);

  return [maximized, setMaximized, blur];
};
