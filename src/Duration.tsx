import React, { useGlobal, useState, useRef } from 'reactn';
import { TextField } from '@adobe/react-spectrum';
import { usePsd } from 'hooks/usePsd';
import { useProject } from 'hooks/useProject';
import { useProjectActions } from 'hooks/useProjectActions';
import { frameToTimecode, parseTimecode } from 'project/time';

/** Preview 再生中カットの尺（duration）を表示・編集するパネル */
export const Duration: React.FC = () => {
  const cuts = usePsd();
  const index = useGlobal('currentCutIndex')[0];
  const { fps } = useProject();
  const { setTime } = useProjectActions();
  const cut = cuts[index];
  // タイムコード文字列で編集し、確定時にフレーム数へ変換する（Edit の TIME 列と同方式）
  const [draft, setDraft] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const commit = () => {
    if (!cancelRef.current && draft !== null) {
      const frames = parseTimecode(draft, fps);
      if (frames !== null) setTime(index, frames);
    }
    cancelRef.current = false;
    setDraft(null);
  };

  const seconds = ((cut?.time ?? 0) / fps).toFixed(2);

  return (
    <TextField
      label={cut ? `Cut${('00' + (index + 1)).slice(-3)} duration · ${seconds}秒 @ ${fps}fps` : undefined}
      aria-label="Duration"
      width="100%"
      marginTop="size-100"
      value={draft ?? frameToTimecode(cut?.time ?? 0, fps)}
      onChange={setDraft}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLElement).blur();
        if (e.key === 'Escape') {
          cancelRef.current = true;
          (e.target as HTMLElement).blur();
        }
      }}
      isDisabled={!cut}
    />
  );
};
