import { describe, it, expect } from 'vitest';
import { mapBlendMode } from './blendMode';

describe('mapBlendMode', () => {
  it('1:1 対応するモードはそのまま', () => {
    expect(mapBlendMode('normal')).toBe('source-over');
    expect(mapBlendMode('multiply')).toBe('multiply');
    expect(mapBlendMode('screen')).toBe('screen');
    expect(mapBlendMode('overlay')).toBe('overlay');
    expect(mapBlendMode('darken')).toBe('darken');
    expect(mapBlendMode('lighten')).toBe('lighten');
    expect(mapBlendMode('color dodge')).toBe('color-dodge');
    expect(mapBlendMode('color burn')).toBe('color-burn');
    expect(mapBlendMode('hard light')).toBe('hard-light');
    expect(mapBlendMode('soft light')).toBe('soft-light');
    expect(mapBlendMode('difference')).toBe('difference');
    expect(mapBlendMode('exclusion')).toBe('exclusion');
    expect(mapBlendMode('hue')).toBe('hue');
    expect(mapBlendMode('saturation')).toBe('saturation');
    expect(mapBlendMode('color')).toBe('color');
    expect(mapBlendMode('luminosity')).toBe('luminosity');
    expect(mapBlendMode('linear dodge')).toBe('lighter'); // = add
  });
  it('canvas 非対応は最寄り近似', () => {
    expect(mapBlendMode('linear burn')).toBe('multiply');
    expect(mapBlendMode('vivid light')).toBe('hard-light');
    expect(mapBlendMode('linear light')).toBe('hard-light');
    expect(mapBlendMode('pin light')).toBe('hard-light');
    expect(mapBlendMode('hard mix')).toBe('hard-light');
    expect(mapBlendMode('darker color')).toBe('darken');
    expect(mapBlendMode('lighter color')).toBe('lighten');
    expect(mapBlendMode('subtract')).toBe('difference');
    expect(mapBlendMode('divide')).toBe('color-dodge');
  });
  it('近似不能・不明・未指定は source-over にフォールバック', () => {
    expect(mapBlendMode('dissolve')).toBe('source-over');
    expect(mapBlendMode('pass through')).toBe('source-over');
    expect(mapBlendMode('unknown-xyz')).toBe('source-over');
    expect(mapBlendMode(undefined)).toBe('source-over');
  });
});
