import React, { useGlobal } from 'reactn';
import { TextArea } from '@adobe/react-spectrum';
import { usePsd } from 'hooks/usePsd';
import { useProjectActions } from 'hooks/useProjectActions';

/** Preview 再生中のカットの台詞を表示・編集するパネル */
export const Dialogue: React.FC = () => {
  const cuts = usePsd();
  const index = useGlobal('currentCutIndex')[0];
  const { setDialogue } = useProjectActions();
  const cut = cuts[index];

  return (
    <TextArea
      label={cut ? `Cut${('00' + (index + 1)).slice(-3)}` : undefined}
      aria-label="Dialogue"
      minWidth="100%"
      width="100%"
      marginTop="size-100"
      value={cut?.dialogue ?? ''}
      onChange={(value) => setDialogue(index, value)}
      onKeyDown={(e) => {
        // Esc でフォーカスを外し、プレイヤーのショートカット（Space/矢印）へ復帰させる
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
      }}
      isDisabled={!cut}
    />
  );
};
