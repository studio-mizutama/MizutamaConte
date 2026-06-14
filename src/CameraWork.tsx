import React, { useGlobal, useState, useEffect } from 'reactn';
import { Grid, Slider, Text } from '@adobe/react-spectrum';
import { useProject } from 'hooks/useProject';
import { useProjectActions } from 'hooks/useProjectActions';
import { cutCanvas } from 'project/scene';
import { cameraRanges, posBound, clampNum } from 'project/camera';

interface Draft {
  posInX: number;
  posInY: number;
  posOutX: number;
  posOutY: number;
  scaleIn: number;
  scaleOut: number;
}

/** position スライダー（トップレベル定義: コンポーネント内定義による毎レンダリング再マウントを防ぐ）。
 *  onChange は表示用ドラフト更新、onChangeEnd で project へ確定する二段構え。 */
const PosSlider: React.FC<{
  label: string;
  bound: number;
  value: number;
  isDisabled: boolean;
  onChange: (v: number) => void;
  onChangeEnd: (v: number) => void;
}> = ({ label, bound, value, isDisabled, onChange, onChangeEnd }) => (
  <Slider
    label={label}
    isDisabled={isDisabled || bound === 0}
    minValue={-(bound || 0.5)}
    maxValue={bound || 0.5}
    step={0.01}
    value={clampNum(value, -bound, bound)}
    onChange={onChange}
    onChangeEnd={onChangeEnd}
    width="100%"
    getValueLabel={(v) => v.toFixed(2)}
  />
);

/** 選択中カットのカメラワーク（IN/OUT の位置・スケール）をスライダーで編集するパネル。
 *  スライダーの可動域をキャンバス内に制限するため、フレームが作画の外には出ない。 */
export const CameraWork: React.FC = () => {
  const index = useGlobal('selectedCutIndex')[0];
  const { project, frame } = useProject();
  const { setCameraWork } = useProjectActions();
  const cut = project.cuts[index];
  const canvas = cut ? cutCanvas(cut) : frame;
  const { ratioW, ratioH, scaleMin, scaleMax } = cameraRanges(canvas, frame);
  // canvas が frame と両軸で等しい（ネイティブ解像度）= カメラ可動域ゼロ → 編集不可
  const noCameraRoom = canvas.width <= frame.width && canvas.height <= frame.height;
  const disabled = !cut || noCameraRoom;
  // 片軸のみ拡張されたキャンバスは scale 固定（=1）でパンのみ可能 → Scale スライダーは無効
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
    // 確定と同時に draft をクリアする。クランプで値が補正された場合に
    // useEffect の発火を待たず即座に base 表示へ戻し、1フレームの未クランプ表示を防ぐ。
    setDraft(null);
  };

  // ドラッグ中: draft のみ更新（CameraWork 自身だけ再描画。project は触らない）
  const onDrag = (over: Partial<Draft>) => setDraft({ ...cur, ...over });

  // position スライダーの ± 可動域（0 のときは min=max を避けるため微小幅 + 無効化）
  const bxIn = posBound(ratioW, cur.scaleIn);
  const byIn = posBound(ratioH, cur.scaleIn);
  const bxOut = posBound(ratioW, cur.scaleOut);
  const byOut = posBound(ratioH, cur.scaleOut);

  return (
    <Grid columns={['1fr', '1fr']} columnGap="size-200" rowGap="size-100" width="100%">
      <Slider
        label="Scale In"
        isDisabled={disabled || scaleLocked}
        minValue={scaleMin}
        maxValue={scaleMax}
        step={0.01}
        value={cur.scaleIn}
        onChange={(v) => onDrag({ scaleIn: v })}
        onChangeEnd={(v) => commit({ scaleIn: v })}
        width="100%"
        getValueLabel={(v) => v.toFixed(2)}
      />
      <Slider
        label="Scale Out"
        isDisabled={disabled || scaleLocked}
        minValue={scaleMin}
        maxValue={scaleMax}
        step={0.01}
        value={cur.scaleOut}
        onChange={(v) => onDrag({ scaleOut: v })}
        onChangeEnd={(v) => commit({ scaleOut: v })}
        width="100%"
        getValueLabel={(v) => v.toFixed(2)}
      />
      <PosSlider label="Pos In X" bound={bxIn} value={cur.posInX} isDisabled={disabled} onChange={(v) => onDrag({ posInX: v })} onChangeEnd={(v) => commit({ posInX: v })} />
      <PosSlider label="Pos In Y" bound={byIn} value={cur.posInY} isDisabled={disabled} onChange={(v) => onDrag({ posInY: v })} onChangeEnd={(v) => commit({ posInY: v })} />
      <PosSlider label="Pos Out X" bound={bxOut} value={cur.posOutX} isDisabled={disabled} onChange={(v) => onDrag({ posOutX: v })} onChangeEnd={(v) => commit({ posOutX: v })} />
      <PosSlider label="Pos Out Y" bound={byOut} value={cur.posOutY} isDisabled={disabled} onChange={(v) => onDrag({ posOutY: v })} onChangeEnd={(v) => commit({ posOutY: v })} />
      {!cut ? (
        <Text gridColumn="1 / -1">カットを選択してください</Text>
      ) : noCameraRoom ? (
        <Text gridColumn="1 / -1">ネイティブ解像度のカットにはカメラワークがありません（クロップで拡大すると有効）</Text>
      ) : (
        <></>
      )}
    </Grid>
  );
};
