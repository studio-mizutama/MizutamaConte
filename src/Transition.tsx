import React, { useGlobal } from 'reactn';
import { Flex, Slider, Picker, Item, Text } from '@adobe/react-spectrum';
import { LabelLL } from 'Label';

export const Transition: React.FC = () => {
  const cut = useGlobal('cut')[0];
  return (
    <>
      <Flex direction="row" gap="size-200" wrap>
        <LabelLL>Fade In</LabelLL>
        <Picker width="184px" selectedKey={cut.action?.fadeIn} defaultSelectedKey="None">
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
        <Slider label="Duration" maxValue={480} value={cut.action?.fadeInDuration} width="256px" />
        <LabelLL>Fade Out</LabelLL>
        <Picker width="184px" selectedKey={cut.action?.fadeOut} defaultSelectedKey="None">
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
        <Slider label="Duration" maxValue={480} value={cut.action?.fadeOutDuration} width="256px" />
      </Flex>
    </>
  );
};
