import React, { useState } from 'reactn';
import { Key } from 'react';
import { Flex, Slider, Picker, Item, Text } from '@adobe/react-spectrum';
import { LabelLL } from 'Label';

export const Transition: React.FC = () => {
  const [inSelected, setInSelected] = useState('None');
  const [outSelected, setOutSelected] = useState('None');
  return (
    <>
      <Flex direction="row" gap="size-200" wrap>
        <LabelLL>Fade In</LabelLL>
        <Picker width="184px" selectedKey={inSelected} onSelectionChange={setInSelected as (keys: Key) => any}>
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
        <Slider label="Duration" maxValue={480} defaultValue={24} width="100%" />
        <LabelLL>Fade Out</LabelLL>
        <Picker width="184px" selectedKey={outSelected} onSelectionChange={setOutSelected as (keys: Key) => any}>
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
        <Slider label="Duration" maxValue={480} defaultValue={24} width="100%" />
      </Flex>
    </>
  );
};
