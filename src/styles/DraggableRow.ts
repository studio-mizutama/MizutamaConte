import styled from 'styled-components';

/**
 * 並べ替えドラッグ中の行ラッパに共通の視覚スタイル。
 * - ドラッグ元: 半透明（opacity 0.4）
 * - ドロップ先候補: 上辺をインフォメーティブ色でハイライト
 * - カーソル: 既定はドラッグ中 grabbing / それ以外 grab。$cursor で上書き可能
 *
 * Conte の CUT 行 / SceneBand / Outline の 3 箇所から共有する（DRY）。
 */
export const DraggableRow = styled.div<{
  $dragging: boolean;
  $dropTarget: boolean;
  $cursor?: string;
}>`
  opacity: ${(p) => (p.$dragging ? 0.4 : 1)};
  box-shadow: ${(p) =>
    p.$dropTarget ? 'inset 0 3px 0 0 var(--spectrum-semantic-informative-color-border, #2680eb)' : 'none'};
  cursor: ${(p) => p.$cursor ?? (p.$dragging ? 'grabbing' : 'grab')};
`;
