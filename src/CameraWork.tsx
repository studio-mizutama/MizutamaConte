import React, { useGlobal, useState, useEffect } from 'reactn';
import { Slider, ActionButton, TooltipTrigger, Tooltip } from '@adobe/react-spectrum';
import Switch from '@spectrum-icons/workflow/Switch';
import { useProject } from 'hooks/useProject';
import { useProjectActions } from 'hooks/useProjectActions';
import { cutCanvas } from 'project/scene';
import { cameraRanges, posBound, clampNum } from 'project/camera';
import { useT } from 'i18n';

interface Draft {
  posInX: number;
  posInY: number;
  posOutX: number;
  posOutY: number;
  scaleIn: number;
  scaleOut: number;
}

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--spectrum-global-dimension-font-size-75)',
  color: 'var(--spectrum-alias-label-text-color)',
  whiteSpace: 'nowrap',
  flex: '1 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

/** スライダーの値表示と同サイズの編集可能な数値入力（react-spectrum TextField は min-width が
 *  大きく狭いセルに収まらないため、小さなプレーン input を使う）。 */
const valueInputStyle = (isDisabled: boolean): React.CSSProperties => ({
  width: '40px',
  flexShrink: 0,
  textAlign: 'right',
  fontSize: 'var(--spectrum-global-dimension-font-size-75)',
  fontFamily: 'inherit',
  border: 'none',
  background: 'transparent',
  padding: 0,
  margin: 0,
  color: isDisabled ? 'var(--spectrum-alias-text-color-disabled, #b3b3b3)' : 'var(--spectrum-alias-text-color)',
});

/** ラベル + 数値入力(quiet TextField) + スライダー の1項目。
 *  数値はローカル下書き → Enter/blur で確定（クランプは親 onCommit が担う）。
 *  ラベル行はセル幅(100%)に制約し、はみ出しを防ぐ。 */
const CameraField: React.FC<{
  label: string;
  value: number;
  minValue: number;
  maxValue: number;
  isDisabled: boolean;
  onDrag: (v: number) => void;
  onCommit: (v: number) => void;
}> = ({ label, value, minValue, maxValue, isDisabled, onDrag, onCommit }) => {
  const [text, setText] = useState<string | null>(null);
  const commitText = () => {
    if (text !== null) {
      const n = Number(text);
      if (Number.isFinite(n)) onCommit(n);
    }
    setText(null);
  };
  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%', minWidth: 0 }}>
        <span style={labelStyle}>{label}</span>
        <input
          aria-label={label}
          type="text"
          inputMode="decimal"
          disabled={isDisabled}
          value={text ?? value.toFixed(2)}
          onChange={(e) => setText(e.target.value)}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.currentTarget.blur();
            }
            if (e.key === 'Escape') {
              setText(null);
              e.currentTarget.blur();
            }
          }}
          style={valueInputStyle(isDisabled)}
        />
      </div>
      <Slider
        aria-label={label}
        isDisabled={isDisabled}
        minValue={minValue}
        maxValue={maxValue}
        step={0.01}
        value={clampNum(value, minValue, maxValue)}
        onChange={onDrag}
        onChangeEnd={onCommit}
        width="100%"
      />
    </div>
  );
};

/** in/out 入れ替えボタン（Spectrum Switch アイコン）。
 *  vertical=true で縦向き（上下に並ぶ pos in/out 用に矢印を90°回転）。 */
const SwapButton: React.FC<{ label: string; isDisabled: boolean; vertical?: boolean; onPress: () => void }> = ({
  label,
  isDisabled,
  vertical,
  onPress,
}) => (
  <TooltipTrigger delay={300}>
    <ActionButton isQuiet isDisabled={isDisabled} onPress={onPress} aria-label={label}>
      <Switch UNSAFE_style={vertical ? { transform: 'rotate(90deg)' } : undefined} />
    </ActionButton>
    <Tooltip>{label}</Tooltip>
  </TooltipTrigger>
);

// 3カラム [1fr, auto(swap), 1fr]。中央列はスケールswap専用、pos行では空セル。
const centerCell: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center' };

/** 選択中カットのカメラワーク（IN/OUT の位置・スケール）を編集するパネル。
 *  スライダーの可動域をキャンバス内に制限するため、フレームが作画の外には出ない。 */
export const CameraWork: React.FC = () => {
  const t = useT();
  const index = useGlobal('selectedCutIndex')[0];
  const { project, frame } = useProject();
  const { setCameraWork } = useProjectActions();
  const cut = project.cuts[index];
  const canvas = cut ? cutCanvas(cut) : frame;
  const { ratioW, ratioH, scaleMin, scaleMax } = cameraRanges(canvas, frame);
  // canvas が frame と両軸で等しい（ネイティブ解像度）= カメラ可動域ゼロ → 編集不可
  const noCameraRoom = canvas.width <= frame.width && canvas.height <= frame.height;
  const disabled = !cut || noCameraRoom;
  // 片軸のみ拡張されたキャンバスは scale 固定（=1）でパンのみ可能 → Scale 編集は無効
  const scaleLocked = scaleMin >= scaleMax;
  const cw = cut?.cameraWork;

  // project 上の現在値（onChangeEnd 確定後の真の値）
  const base: Draft = {
    posInX: cw?.position?.in.x ?? 0,
    posInY: cw?.position?.in.y ?? 0,
    posOutX: cw?.position?.out.x ?? 0,
    posOutY: cw?.position?.out.y ?? 0,
    scaleIn: clampNum(cw?.scale?.in ?? 1, scaleMin, scaleMax),
    scaleOut: clampNum(cw?.scale?.out ?? 1, scaleMin, scaleMax),
  };

  // ドラッグ中の表示用ドラフト。null のときは project の値(base)をそのまま表示する
  const [draft, setDraft] = useState<Draft | null>(null);
  // カット選択切替・外部更新（cut の参照変化）で draft を破棄し base に追従する
  useEffect(() => {
    setDraft(null);
  }, [index, cut]);

  const cur = draft ?? base;

  // スケールに応じて position の可動域が変わるため、確定時は常に全体を再クランプする
  const commit = (over: Partial<Draft>) => {
    const s = { ...cur, ...over };
    const sIn = clampNum(s.scaleIn, scaleMin, scaleMax);
    const sOut = clampNum(s.scaleOut, scaleMin, scaleMax);
    const bxIn = posBound(ratioW, sIn);
    const byIn = posBound(ratioH, sIn);
    const bxOut = posBound(ratioW, sOut);
    const byOut = posBound(ratioH, sOut);
    setCameraWork(index, {
      scale: { in: sIn, out: sOut },
      position: {
        in: { x: clampNum(s.posInX, -bxIn, bxIn), y: clampNum(s.posInY, -byIn, byIn) },
        out: { x: clampNum(s.posOutX, -bxOut, bxOut), y: clampNum(s.posOutY, -byOut, byOut) },
      },
    });
    setDraft(null);
  };

  // ドラッグ中: draft のみ更新（CameraWork 自身だけ再描画。project は触らない）
  const onDrag = (over: Partial<Draft>) => setDraft({ ...cur, ...over });

  // position スライダーの ± 可動域（0 のときは可動なし → 無効）
  const bxIn = posBound(ratioW, cur.scaleIn);
  const byIn = posBound(ratioH, cur.scaleIn);
  const bxOut = posBound(ratioW, cur.scaleOut);
  const byOut = posBound(ratioH, cur.scaleOut);

  const scaleDisabled = disabled || scaleLocked;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', columnGap: '4px', rowGap: '8px', alignItems: 'center' }}>
      {/* Scale 行: In | ⇄(中央) | Out */}
      <CameraField
        label="Scale In"
        value={cur.scaleIn}
        minValue={scaleMin}
        maxValue={scaleMax}
        isDisabled={scaleDisabled}
        onDrag={(v) => onDrag({ scaleIn: v })}
        onCommit={(v) => commit({ scaleIn: v })}
      />
      <div style={centerCell}>
        <SwapButton
          label={t('cameraWork.swapScale')}
          isDisabled={scaleDisabled || cur.scaleIn === cur.scaleOut}
          onPress={() => commit({ scaleIn: cur.scaleOut, scaleOut: cur.scaleIn })}
        />
      </div>
      <CameraField
        label="Scale Out"
        value={cur.scaleOut}
        minValue={scaleMin}
        maxValue={scaleMax}
        isDisabled={scaleDisabled}
        onDrag={(v) => onDrag({ scaleOut: v })}
        onCommit={(v) => commit({ scaleOut: v })}
      />

      {/* Pos In 行（col1=X / col3=Y） */}
      <CameraField
        label="Pos In X"
        value={cur.posInX}
        minValue={-(bxIn || 0.5)}
        maxValue={bxIn || 0.5}
        isDisabled={disabled || bxIn === 0}
        onDrag={(v) => onDrag({ posInX: v })}
        onCommit={(v) => commit({ posInX: v })}
      />
      <div />
      <CameraField
        label="Pos In Y"
        value={cur.posInY}
        minValue={-(byIn || 0.5)}
        maxValue={byIn || 0.5}
        isDisabled={disabled || byIn === 0}
        onDrag={(v) => onDrag({ posInY: v })}
        onCommit={(v) => commit({ posInY: v })}
      />

      {/* 縦スワップ行: X列 | (空) | Y列 */}
      <div style={centerCell}>
        <SwapButton
          label={t('cameraWork.swapPosX')}
          vertical
          isDisabled={disabled || cur.posInX === cur.posOutX}
          onPress={() => commit({ posInX: cur.posOutX, posOutX: cur.posInX })}
        />
      </div>
      <div />
      <div style={centerCell}>
        <SwapButton
          label={t('cameraWork.swapPosY')}
          vertical
          isDisabled={disabled || cur.posInY === cur.posOutY}
          onPress={() => commit({ posInY: cur.posOutY, posOutY: cur.posInY })}
        />
      </div>

      {/* Pos Out 行（col1=X / col3=Y） */}
      <CameraField
        label="Pos Out X"
        value={cur.posOutX}
        minValue={-(bxOut || 0.5)}
        maxValue={bxOut || 0.5}
        isDisabled={disabled || bxOut === 0}
        onDrag={(v) => onDrag({ posOutX: v })}
        onCommit={(v) => commit({ posOutX: v })}
      />
      <div />
      <CameraField
        label="Pos Out Y"
        value={cur.posOutY}
        minValue={-(byOut || 0.5)}
        maxValue={byOut || 0.5}
        isDisabled={disabled || byOut === 0}
        onDrag={(v) => onDrag({ posOutY: v })}
        onCommit={(v) => commit({ posOutY: v })}
      />
    </div>
  );
};
