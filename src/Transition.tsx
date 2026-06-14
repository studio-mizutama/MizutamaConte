import React, { useGlobal } from 'reactn';
import { Flex, Slider, Picker, Item, Text } from '@adobe/react-spectrum';
import { LabelLL } from 'Label';
import { useProject } from 'hooks/useProject';
import { useProjectActions } from 'hooks/useProjectActions';

/** 選択中カットのトランジション（フェード種別・尺）を編集するパネル */
export const Transition: React.FC = () => {
  const index = useGlobal('selectedCutIndex')[0];
  const { project } = useProject();
  const { setAction } = useProjectActions();
  const cut = project.cuts[index];
  const action = cut?.action;
  const disabled = !cut;

  // 'None' は「フェード無し」= undefined として保存する（表示判定が truthy のため）
  const update = (patch: Partial<Action>) => setAction(index, { ...action, ...patch });

  return (
    <Flex direction="row" gap="size-200" wrap>
      <LabelLL>Fade In</LabelLL>
      <Picker
        width="184px"
        isDisabled={disabled}
        selectedKey={action?.fadeIn ?? 'None'}
        onSelectionChange={(k) => update({ fadeIn: k === 'None' ? undefined : (k as Action['fadeIn']) })}
      >
        <Item key="None">
          <Text>None</Text>
        </Item>
        <Item key="White In">
          <Text>White In</Text>
        </Item>
        <Item key="Black In">
          <Text>Black In</Text>
        </Item>
        <Item key="Cross">
          <Text>Cross</Text>
        </Item>
      </Picker>
      <Slider
        label="Duration"
        maxValue={480}
        width="256px"
        isDisabled={disabled}
        value={action?.fadeInDuration ?? 0}
        onChange={(v) => update({ fadeInDuration: v })}
      />
      <LabelLL>Fade Out</LabelLL>
      <Picker
        width="184px"
        isDisabled={disabled}
        selectedKey={action?.fadeOut ?? 'None'}
        onSelectionChange={(k) => update({ fadeOut: k === 'None' ? undefined : (k as Action['fadeOut']) })}
      >
        <Item key="None">
          <Text>None</Text>
        </Item>
        <Item key="White Out">
          <Text>White Out</Text>
        </Item>
        <Item key="Black Out">
          <Text>Black Out</Text>
        </Item>
        <Item key="Cross">
          <Text>Cross</Text>
        </Item>
      </Picker>
      <Slider
        label="Duration"
        maxValue={480}
        width="256px"
        isDisabled={disabled}
        value={action?.fadeOutDuration ?? 0}
        onChange={(v) => update({ fadeOutDuration: v })}
      />
    </Flex>
  );
};
