import React, { useGlobal } from 'reactn';
import { Flex, Slider, Picker, Item, Text } from '@adobe/react-spectrum';
import { LabelLL } from 'Label';
import { useProject } from 'hooks/useProject';
import { useProjectActions } from 'hooks/useProjectActions';
import { useT } from 'i18n';

/** 選択中カットのトランジション（フェード種別・尺）を編集するパネル */
export const Transition: React.FC = () => {
  const t = useT();
  const index = useGlobal('selectedCutIndex')[0];
  const { project } = useProject();
  const { setAction } = useProjectActions();
  const cut = project.cuts[index];
  const action = cut?.action;
  const disabled = !cut;

  // 'None' は「フェード無し」= undefined として保存する（表示判定が truthy のため）
  const update = (patch: Partial<Action>) => setAction(index, { ...action, ...patch });

  // フェード尺はカット尺(time)を超えない
  const maxDuration = cut?.time ?? 0;

  return (
    <Flex direction="row" gap="size-200" wrap>
      <LabelLL>{t('transition.fadeIn')}</LabelLL>
      <Picker
        width="184px"
        isDisabled={disabled}
        selectedKey={action?.fadeIn ?? 'None'}
        onSelectionChange={(k) => update({ fadeIn: k === 'None' ? undefined : (k as Action['fadeIn']) })}
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
        maxValue={maxDuration}
        width="256px"
        isDisabled={disabled || maxDuration === 0}
        value={Math.min(action?.fadeInDuration ?? 0, maxDuration)}
        onChange={(v) => update({ fadeInDuration: v })}
      />
      <LabelLL>{t('transition.fadeOut')}</LabelLL>
      <Picker
        width="184px"
        isDisabled={disabled}
        selectedKey={action?.fadeOut ?? 'None'}
        onSelectionChange={(k) => update({ fadeOut: k === 'None' ? undefined : (k as Action['fadeOut']) })}
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
        maxValue={maxDuration}
        width="256px"
        isDisabled={disabled || maxDuration === 0}
        value={Math.min(action?.fadeOutDuration ?? 0, maxDuration)}
        onChange={(v) => update({ fadeOutDuration: v })}
      />
    </Flex>
  );
};
