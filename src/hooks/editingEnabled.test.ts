import { describe, it, expect } from 'vitest';
import { computeEditingEnabled } from './editingEnabled';
describe('computeEditingEnabled', () => {
  it('未オープン（fileName 空）は false', () => { expect(computeEditingEnabled('', 'edit')).toBe(false); });
  it('オープン済み + edit は true', () => { expect(computeEditingEnabled('p.psd', 'edit')).toBe(true); });
  it('resize は false', () => { expect(computeEditingEnabled('p.psd', 'resize')).toBe(false); });
  it('reorder は false', () => { expect(computeEditingEnabled('p.psd', 'reorder')).toBe(false); });
});
