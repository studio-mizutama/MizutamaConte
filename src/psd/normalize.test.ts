import { describe, it, expect } from 'vitest';
import { normalizePsdLayers } from './normalize';
import type { Psd } from 'ag-psd';

// Node 環境（vitest・document 不在）では document を参照せず構造をそのまま返す。
// ここではグループ構造が壊れずに通過することを確認する（再帰の入口がグループを潰さない）。
describe('normalizePsdLayers (group recursion)', () => {
  it('グループ構造を保持して返す（Node では再配置せず構造維持）', () => {
    const psd = {
      width: 10,
      height: 10,
      children: [{ name: 'bg' }, { name: 'g', children: [{ name: 'a' }, { name: 'b' }] }],
    } as unknown as Psd;
    const out = normalizePsdLayers(psd);
    expect(out.children?.length).toBe(2);
    expect(out.children?.[1].children?.length).toBe(2);
    expect(out.children?.[1].children?.[0].name).toBe('a');
  });

  it('children 無しはそのまま返す', () => {
    const psd = { width: 10, height: 10 } as unknown as Psd;
    expect(normalizePsdLayers(psd)).toBe(psd);
  });
});
