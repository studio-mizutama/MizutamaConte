import React, { useState } from 'reactn';
import { Key } from 'react';
import { Text, Picker, Item } from '@adobe/react-spectrum';

export const Dialogue: React.FC = () => {
  const [selected, setSelected] = useState('Minorin');
  return (
    <>
      <Picker
        label="Character"
        width="100%"
        selectedKey={selected}
        onSelectionChange={setSelected as (keys: Key) => any}
      >
        <Item key="Minorin">
          <Text>Minorin</Text>
        </Item>
        <Item key="En">
          <Text>En</Text>
        </Item>
      </Picker>
    </>
  );
};
