import { useState, useEffect, useGlobal } from 'reactn';
import { readPsd } from 'ag-psd';
const { api } = window;

export const usePsd = (prtCut: Cut) => {
  const [cuts, setCuts] = useState([prtCut]);
  const globalCuts = useGlobal('globalCuts')[0];
  const globalPsds = useGlobal('globalPsds')[0];

  useEffect(() => {
    const f = async () => {
      const joinBy = (arr1: Cut[], arr2: Cut[]) => {
        const arr2Dict = new Map(arr2?.map((o, index) => [index, o]));
        return arr1?.map((item, index) => ({ ...item, ...arr2Dict.get(index) }));
      };
      if (!api) {
        const psds = globalPsds;
        const cutsWithNoPicture: Cut[] = globalCuts;
        const cutsWithNoJson: Cut[] = psds?.map((psd) => {
          return { picture: psd };
        });
        const cuts = joinBy(cutsWithNoPicture, cutsWithNoJson);
        setCuts(cuts);
        return;
      }
      const psdfiles = await api.loadPSD();
      const json = await api.loadJSON();
      const psds = psdfiles?.map((psdfile) => readPsd(psdfile));
      const cutsWithNoPicture: Cut[] = json;
      const cutsWithNoJson: Cut[] = psds?.map((psd) => {
        return { picture: psd };
      });

      const cuts = joinBy(cutsWithNoPicture, cutsWithNoJson);
      setCuts(cuts);
    };
    f();
  }, [globalCuts, globalPsds, setCuts]);

  return cuts;
};
