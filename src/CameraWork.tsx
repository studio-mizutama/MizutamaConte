import React, { useGlobal } from 'reactn';
import { Flex, NumberField } from '@adobe/react-spectrum';
import { LabelTop, LabelSideL, LabelSideM } from 'Label';
import { useProject } from 'hooks/useProject';
import { useProjectActions } from 'hooks/useProjectActions';

/** 選択中カットのカメラワーク（IN/OUT の位置・スケール）を編集するパネル */
export const CameraWork: React.FC = () => {
  const index = useGlobal('selectedCutIndex')[0];
  const { project } = useProject();
  const { setCameraWork } = useProjectActions();
  const cut = project.cuts[index];
  const cw = cut?.cameraWork;
  const disabled = !cut;

  // 既存値を欠損なく引き継ぐ正規化済みのカメラワークを作る
  const base = (): CameraWork => ({
    position: {
      in: { x: cw?.position?.in.x ?? 0, y: cw?.position?.in.y ?? 0 },
      out: { x: cw?.position?.out.x ?? 0, y: cw?.position?.out.y ?? 0 },
    },
    scale: { in: cw?.scale?.in ?? 1, out: cw?.scale?.out ?? 1 },
  });

  const setPos = (which: 'in' | 'out', axis: 'x' | 'y', v: number) => {
    if (Number.isNaN(v)) return;
    const next = base();
    next.position![which][axis] = v;
    setCameraWork(index, next);
  };
  const setScale = (which: 'in' | 'out', v: number) => {
    if (Number.isNaN(v)) return;
    const next = base();
    next.scale![which] = v;
    setCameraWork(index, next);
  };

  const fieldProps = { width: '72px', isQuiet: true, isDisabled: disabled, step: 0.05 } as const;

  return (
    <>
      <LabelTop>Position</LabelTop>
      <Flex direction="row" gap="size-200" wrap alignItems="end">
        <LabelSideL>In</LabelSideL>
        <LabelSideM>X</LabelSideM>
        <NumberField {...fieldProps} aria-label="Position In X" value={cw?.position?.in.x ?? 0} onChange={(v) => setPos('in', 'x', v)} />
        <LabelSideM>Y</LabelSideM>
        <NumberField {...fieldProps} aria-label="Position In Y" value={cw?.position?.in.y ?? 0} onChange={(v) => setPos('in', 'y', v)} />
        <LabelSideL>Out</LabelSideL>
        <LabelSideM>X</LabelSideM>
        <NumberField {...fieldProps} aria-label="Position Out X" value={cw?.position?.out.x ?? 0} onChange={(v) => setPos('out', 'x', v)} />
        <LabelSideM>Y</LabelSideM>
        <NumberField {...fieldProps} aria-label="Position Out Y" value={cw?.position?.out.y ?? 0} onChange={(v) => setPos('out', 'y', v)} />
        <LabelSideL>Scale</LabelSideL>
        <LabelSideM>In</LabelSideM>
        <NumberField {...fieldProps} aria-label="Scale In" minValue={0} value={cw?.scale?.in ?? 1} onChange={(v) => setScale('in', v)} />
        <LabelSideM>Out</LabelSideM>
        <NumberField {...fieldProps} aria-label="Scale Out" minValue={0} value={cw?.scale?.out ?? 1} onChange={(v) => setScale('out', v)} />
      </Flex>
    </>
  );
};
