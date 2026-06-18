import { describe, it, expect, beforeEach } from 'vitest';
import { isApplying, setApplying } from './applyingGuard';
describe('applyingGuard', () => {
  beforeEach(() => setApplying(false));
  it('初期は false', () => expect(isApplying()).toBe(false));
  it('true 設定', () => { setApplying(true); expect(isApplying()).toBe(true); });
});
