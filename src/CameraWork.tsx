import React, { useGlobal } from 'reactn';
import { Flex, Slider, Text } from '@adobe/react-spectrum';
import { LabelTop } from 'Label';
import { useProject } from 'hooks/useProject';
import { useProjectActions } from 'hooks/useProjectActions';
import { cutCanvas } from 'project/scene';
import { cameraRanges, posBound, clampNum } from 'project/camera';

/** 選択中カットのカメラワーク（IN/OUT の位置・スケール）をスライダーで編集するパネル。
 *  スライダーの可動域をキャンバス内に制限するため、フレームが作画の外には出ない。 */
export const CameraWork: React.FC = () => {
  const index = useGlobal('selectedCutIndex')[0];
  const { project, frame } = useProject();
  const { setCameraWork } = useProjectActions();
  const cut = project.cuts[index];
  const disabled = !cut;
  const canvas = cut ? cutCanvas(cut) : frame;
  const { ratioW, ratioH, scaleMin, scaleMax } = cameraRanges(canvas, frame);
  const cw = cut?.cameraWork;

  const cur = {
    posInX: cw?.position?.in.x ?? 0,
    posInY: cw?.position?.in.y ?? 0,
    posOutX: cw?.position?.out.x ?? 0,
    posOutY: cw?.position?.out.y ?? 0,
    scaleIn: clampNum(cw?.scale?.in ?? 1, scaleMin, scaleMax),
    scaleOut: clampNum(cw?.scale?.out ?? 1, scaleMin, scaleMax),
  };

  // スケールに応じて position の可動域が変わるため、変更時は常に全体を再クランプする
  const commit = (over: Partial<typeof cur>) => {
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
  };

  // position スライダーの ± 可動域（0 のときは min=max を避けるため微小幅 + 無効化）
  const bxIn = posBound(ratioW, cur.scaleIn);
  const byIn = posBound(ratioH, cur.scaleIn);
  const bxOut = posBound(ratioW, cur.scaleOut);
  const byOut = posBound(ratioH, cur.scaleOut);

  const PosSlider: React.FC<{ label: string; bound: number; value: number; onChange: (v: number) => void }> = ({
    label,
    bound,
    value,
    onChange,
  }) => (
    <Slider
      label={label}
      isDisabled={disabled || bound === 0}
      minValue={-(bound || 0.5)}
      maxValue={bound || 0.5}
      step={0.01}
      value={clampNum(value, -bound, bound)}
      onChange={onChange}
      width="100%"
      getValueLabel={(v) => v.toFixed(2)}
    />
  );

  return (
    <Flex direction="column" gap="size-100">
      <LabelTop>Scale</LabelTop>
      <Slider
        label="In"
        isDisabled={disabled}
        minValue={scaleMin}
        maxValue={scaleMax}
        step={0.01}
        value={cur.scaleIn}
        onChange={(v) => commit({ scaleIn: v })}
        width="100%"
        getValueLabel={(v) => v.toFixed(2)}
      />
      <Slider
        label="Out"
        isDisabled={disabled}
        minValue={scaleMin}
        maxValue={scaleMax}
        step={0.01}
        value={cur.scaleOut}
        onChange={(v) => commit({ scaleOut: v })}
        width="100%"
        getValueLabel={(v) => v.toFixed(2)}
      />
      <LabelTop>Position In</LabelTop>
      <PosSlider label="X" bound={bxIn} value={cur.posInX} onChange={(v) => commit({ posInX: v })} />
      <PosSlider label="Y" bound={byIn} value={cur.posInY} onChange={(v) => commit({ posInY: v })} />
      <LabelTop>Position Out</LabelTop>
      <PosSlider label="X" bound={bxOut} value={cur.posOutX} onChange={(v) => commit({ posOutX: v })} />
      <PosSlider label="Y" bound={byOut} value={cur.posOutY} onChange={(v) => commit({ posOutY: v })} />
      {disabled ? <Text>カットを選択してください</Text> : <></>}
    </Flex>
  );
};
