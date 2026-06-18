import React, { useGlobal } from 'reactn';
import { Flex, Slider, Picker, Item, Text } from '@adobe/react-spectrum';
import { LabelLL } from 'Label';
import { useProject } from 'hooks/useProject';
import { useProjectActions } from 'hooks/useProjectActions';
import { useEditingEnabled } from 'hooks/editingEnabled';
import { FadeType } from 'project/actions';
import { useT } from 'i18n';

/** 選択中カットのトランジション（フェード種別・尺）を編集するパネル */
export const Transition: React.FC = () => {
  const t = useT();
  const index = useGlobal('selectedCutIndex')[0];
  const { project } = useProject();
  const { setFadeTypeAt, setFadeDurationAt } = useProjectActions();
  const editingEnabled = useEditingEnabled();
  const cut = project.cuts[index];
  const action = cut?.action;
  const total = project.cuts.length;
  const disabled = !cut || !editingEnabled;

  // フェード尺はカット尺(time)を超えない
  const maxDuration = cut?.time ?? 0;

  // None 選択時はスライダー無効＋表示0、非None時は最小値1（0コマフェード=実質None を選ばせない）。
  // maxDuration が 0 の時は min も 0 に倒す（react-spectrum Slider の min>max を回避）。
  const isNoneIn = (action?.fadeIn ?? 'None') === 'None';
  const isNoneOut = (action?.fadeOut ?? 'None') === 'None';
  const minIn = !isNoneIn && maxDuration >= 1 ? 1 : 0;
  const minOut = !isNoneOut && maxDuration >= 1 ? 1 : 0;

  return (
    <Flex direction="row" gap="size-200" wrap>
      <LabelLL>{t('transition.fadeIn')}</LabelLL>
      <Picker
        width="184px"
        isDisabled={disabled}
        disabledKeys={index === 0 ? ['Cross'] : []}
        selectedKey={action?.fadeIn ?? 'None'}
        onSelectionChange={(k) => setFadeTypeAt(index, 'in', k === 'None' ? undefined : (k as FadeType))}
      >
        <Item key="None">
          <Text>{t('transition.fade.none')}</Text>
        </Item>
        <Item key="White In">
          <Text>{t('transition.fade.whiteIn')}</Text>
        </Item>
        <Item key="Black In">
          <Text>{t('transition.fade.blackIn')}</Text>
        </Item>
        <Item key="Cross">
          <Text>{t('transition.fade.cross')}</Text>
        </Item>
      </Picker>
      <Slider
        label={t('transition.duration')}
        minValue={minIn}
        maxValue={maxDuration}
        width="256px"
        isDisabled={disabled || maxDuration === 0 || isNoneIn}
        value={isNoneIn ? 0 : Math.min(action?.fadeInDuration ?? 0, maxDuration)}
        onChange={(v) => setFadeDurationAt(index, 'in', v)}
      />
      <LabelLL>{t('transition.fadeOut')}</LabelLL>
      <Picker
        width="184px"
        isDisabled={disabled}
        disabledKeys={index === total - 1 ? ['Cross'] : []}
        selectedKey={action?.fadeOut ?? 'None'}
        onSelectionChange={(k) => setFadeTypeAt(index, 'out', k === 'None' ? undefined : (k as FadeType))}
      >
        <Item key="None">
          <Text>{t('transition.fade.none')}</Text>
        </Item>
        <Item key="White Out">
          <Text>{t('transition.fade.whiteOut')}</Text>
        </Item>
        <Item key="Black Out">
          <Text>{t('transition.fade.blackOut')}</Text>
        </Item>
        <Item key="Cross">
          <Text>{t('transition.fade.cross')}</Text>
        </Item>
      </Picker>
      <Slider
        label={t('transition.duration')}
        minValue={minOut}
        maxValue={maxDuration}
        width="256px"
        isDisabled={disabled || maxDuration === 0 || isNoneOut}
        value={isNoneOut ? 0 : Math.min(action?.fadeOutDuration ?? 0, maxDuration)}
        onChange={(v) => setFadeDurationAt(index, 'out', v)}
      />
    </Flex>
  );
};
