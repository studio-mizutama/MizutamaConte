import { useState } from 'react';

export const useTitle = (
  isMaximized: boolean,
  isBlur: boolean,
): [boolean, React.Dispatch<React.SetStateAction<boolean>>, boolean, React.Dispatch<React.SetStateAction<boolean>>] => {
  const [maximized, setMaximized] = useState(isMaximized);
  const [blur, setBlur] = useState(isBlur);

  return [maximized, setMaximized, blur, setBlur];
};
