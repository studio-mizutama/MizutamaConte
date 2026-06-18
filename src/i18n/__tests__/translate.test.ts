import { describe, it, expect } from 'vitest';
import { translate } from '..';
import { en } from '../catalogs/en';
import { ja } from '../catalogs/ja';
import { ko } from '../catalogs/ko';

describe('translate', () => {
  it('looks up a key per locale', () => {
    expect(translate('en', 'common.save')).toBe('Save');
    expect(translate('ja', 'common.save')).toBe('保存');
    expect(translate('ko', 'common.save')).toBe('저장');
  });

  it('interpolates {name} params', () => {
    expect(translate('en', 'cutRow.resizeAria', { n: 3 })).toBe('Resize cut 3');
    expect(translate('ja', 'conte.scene.titleAriaLabel', { n: 2 })).toBe('シーン2 のタイトル');
  });

  it('keeps unmatched placeholders literal when a param is missing', () => {
    expect(translate('en', 'cutRow.launchFailed', {})).toBe('Could not launch paint app: {error}');
  });

  it('interpolates multiple params (duration label keeps Cut/fps tokens)', () => {
    expect(translate('en', 'duration.label', { cut: '001', sec: '1.50', fps: 24 })).toBe(
      'Cut001 duration · 1.50s @ 24fps',
    );
  });
});

describe('catalog completeness', () => {
  const enKeys = Object.keys(en).sort();

  it('ja has exactly the same keys as en', () => {
    expect(Object.keys(ja).sort()).toEqual(enKeys);
  });

  it('ko has exactly the same keys as en', () => {
    expect(Object.keys(ko).sort()).toEqual(enKeys);
  });

  it('no catalog has empty values', () => {
    for (const [locale, catalog] of [
      ['en', en],
      ['ja', ja],
      ['ko', ko],
    ] as const) {
      for (const [key, value] of Object.entries(catalog)) {
        expect(value, `${locale}.${key} should be non-empty`).toBeTruthy();
      }
    }
  });
});
