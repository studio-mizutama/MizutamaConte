import { useState, useEffect, useGlobal } from 'reactn';

// globalCuts (JSON 由来) と globalPsds (パース済み PSD) を index で結合する
export const usePsd = (prtCut: Cut) => {
  const [cuts, setCuts] = useState([prtCut]);
  const globalCuts = useGlobal('globalCuts')[0];
  const globalPsds = useGlobal('globalPsds')[0];

  useEffect(() => {
    const pictures = globalPsds?.map((psd) => ({ picture: psd }));
    const merged = globalCuts?.map((cut, index) => ({ ...cut, ...(pictures && pictures[index]) }));
    setCuts(merged);
  }, [globalCuts, globalPsds, setCuts]);

  return cuts;
};
