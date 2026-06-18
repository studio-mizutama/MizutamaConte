// undo/redo 再入ガード。複数マウント間で共有するためモジュールスコープに置く。
let applying = false;
export const isApplying = (): boolean => applying;
export const setApplying = (v: boolean): void => { applying = v; };
