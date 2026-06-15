import React, { useCallback, useState } from 'reactn';

/** ドラッグ行に spread する DOM ハンドラ群。未使用のものは undefined（属性ごと外れる） */
export interface RowDragHandlers {
  draggable: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

/** makeDragHandlers の入力。各コールバックは「そのモードで有効なときだけ」渡す（無効時は undefined） */
export interface DragHandlerSpec {
  onStart?: () => void;
  onOver?: () => void;
  onDrop?: () => void;
  onEnd?: () => void;
}

/**
 * onDragStart/onDragOver(preventDefault+over)/onDrop(preventDefault+drop)/onDragEnd の
 * 定型配線を 1 箇所に集約する。各 JSX はモード判定済みのコールバック（or undefined）を渡すだけでよい。
 * - onStart が渡されたときのみ draggable=true
 * - over/drop は preventDefault を内包（HTML5 DnD のドロップ許可に必須）
 */
export const makeDragHandlers = (spec: DragHandlerSpec): RowDragHandlers => ({
  draggable: !!spec.onStart,
  onDragStart: spec.onStart,
  onDragOver: spec.onOver
    ? (e: React.DragEvent) => {
        e.preventDefault();
        spec.onOver?.();
      }
    : undefined,
  onDrop: spec.onDrop
    ? (e: React.DragEvent) => {
        e.preventDefault();
        spec.onDrop?.();
      }
    : undefined,
  onDragEnd: spec.onEnd,
});

/** 並べ替え対象の種別。reorder モードで CUT 行と SCENE 帯を区別する */
export type DragKind = 'cut' | 'scene';

export interface RowDndState {
  /** ドラッグ発生元 index（CUT= cut index / SCENE= シーン先頭 index）。未ドラッグは null */
  dragIndex: number | null;
  /** ドロップ先候補 index（視覚フィードバック用）。未ホバーは null */
  dropIndex: number | null;
  /** ドラッグ中の種別（CUT 行 or SCENE 帯）。未ドラッグは null */
  dragKind: DragKind | null;
  /** 種別を指定してドラッグ開始（dragIndex と dragKind を同時に確定） */
  startDrag: (kind: DragKind, i: number) => void;
  setDropIndex: (i: number | null) => void;
  /** ドラッグ終了時に全状態をリセット */
  endDrag: () => void;
}

/** 並べ替えドラッグの共有状態（dragIndex/dropIndex/dragKind/endDrag）。Conte と Outline で共通 */
export const useRowDnd = (): RowDndState => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [dragKind, setDragKind] = useState<DragKind | null>(null);
  const startDrag = useCallback((kind: DragKind, i: number) => {
    setDragKind(kind);
    setDragIndex(i);
  }, []);
  const endDrag = useCallback(() => {
    setDragIndex(null);
    setDropIndex(null);
    setDragKind(null);
  }, []);
  return { dragIndex, dropIndex, dragKind, startDrag, setDropIndex, endDrag };
};
