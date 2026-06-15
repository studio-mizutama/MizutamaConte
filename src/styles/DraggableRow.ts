import styled from 'styled-components';

/**
 * 並べ替えドラッグ中の行ラッパに共通の視覚スタイル。
 * - ドラッグ元: 半透明（opacity 0.4）
 * - ドロップ先候補: 行の上辺境界に明瞭な挿入線（3px のアクセント色ライン）を表示。
 *   「CUT と CUT の間に入る」ことが視覚的に分かるよう ::before で境界線として描く。
 * - カーソル: 既定はドラッグ中 grabbing / それ以外 grab。$cursor で上書き可能
 *
 * Conte の CUT 行 / SceneBand / Outline の 3 箇所から共有する（DRY）。
 */
export const DraggableRow = styled.div<{
  $dragging: boolean;
  $dropTarget: boolean;
  $cursor?: string;
}>`
  position: relative;
  opacity: ${(p) => (p.$dragging ? 0.4 : 1)};
  cursor: ${(p) => p.$cursor ?? (p.$dragging ? 'grabbing' : 'grab')};

  /* ドロップ先境界の挿入線。行の直上に 3px のアクセント色ラインを重ねる */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: -2px;
    height: 3px;
    border-radius: 2px;
    background: var(--spectrum-semantic-informative-color-border, #2680eb);
    opacity: ${(p) => (p.$dropTarget ? 1 : 0)};
    pointer-events: none;
    z-index: 5;
  }
`;
