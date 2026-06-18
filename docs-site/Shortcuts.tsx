import React from 'react';
import { Heading } from '@adobe/react-spectrum';
import { Locale } from './content/manifest';
import { SHORTCUTS, SC_INTRO, SC_COLS, Bilingual } from './content/shortcuts';

// 操作名は ja / en を持つ。ko は en にフォールバック（短い参照ラベルのため）。
const label = (b: Bilingual, loc: Locale): string => (loc === 'ja' ? b.ja : b.en);

const Keys: React.FC<{ tokens: string[] }> = ({ tokens }) => (
  <>
    {tokens.map((t, i) => (
      <React.Fragment key={i}>
        {i > 0 && ' '}
        <span className="kbd">{t}</span>
      </React.Fragment>
    ))}
  </>
);

export const Shortcuts: React.FC<{ locale: Locale }> = ({ locale }) => {
  const cols = SC_COLS[locale] ?? SC_COLS.en;
  return (
    <div className="sc-page">
      <Heading level={1}>{SHORTCUTS && ({ ja: 'キーボードショートカット', ko: '키보드 단축키', en: 'Keyboard Shortcuts' }[locale] ?? 'Keyboard Shortcuts')}</Heading>
      <p style={{ color: 'var(--ink-2)', maxWidth: 640 }}>{SC_INTRO[locale] ?? SC_INTRO.en}</p>
      {SHORTCUTS.map((g) => (
        <div key={g.h.en}>
          <div className="sc-h">{g.h[locale] ?? g.h.en}</div>
          <table className="sc-table">
            <thead>
              <tr>
                <th>{cols.act}</th>
                <th>{cols.mac}</th>
                <th>{cols.win}</th>
              </tr>
            </thead>
            <tbody>
              {g.rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    {label(r.act, locale)}
                    {r.note && <span style={{ color: 'var(--muted)', marginLeft: 8, fontSize: 13 }}>{label(r.note, locale)}</span>}
                  </td>
                  <td><Keys tokens={r.mac} /></td>
                  <td><Keys tokens={r.win} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};
