import React, { useGlobal, useState } from 'reactn';
import { Key } from 'react';
import styled from 'styled-components';
import { Flex, Heading, Text, Picker, Item, TextArea } from '@adobe/react-spectrum';
import ImageAlbum from '@spectrum-icons/workflow/ImageAlbum';
import MovieCamera from '@spectrum-icons/workflow/MovieCamera';
import ViewList from '@spectrum-icons/workflow/ViewList';
import Comment from '@spectrum-icons/workflow/Comment';
import Asset from '@spectrum-icons/workflow/Asset';
import { Card } from 'Card';

const ToolArea = styled.div`
  padding-left: var(--spectrum-global-dimension-size-200, var(--spectrum-alias-size-200));
  padding-right: var(--spectrum-global-dimension-size-200, var(--spectrum-alias-size-200));
  padding-bottom: var(--spectrum-global-dimension-size-200, var(--spectrum-alias-size-200));
  border-bottom: 2px solid var(--spectrum-alias-appframe-border-color);
`;

const Tool: React.FC<{ Title: string }> = ({ Title, children }) => {
  interface Itool {
    [key: string]: JSX.Element;
  }
  const tool: Itool = {
    Transition: <ImageAlbum size="XS" />,
    'Camera Work': <MovieCamera size="XS" />,
    Outline: <ViewList size="XS" />,
    Dialogue: <Comment size="XS" />,
    Media: <Asset size="XS" />,
  };

  const iconRender = (title: string): JSX.Element => tool[title];

  return (
    <ToolArea>
      <Flex direction="row" alignItems="center">
        {iconRender(Title)}
        <Heading level={4} margin="size-200">
          <Text>{Title}</Text>
        </Heading>
      </Flex>
      {children}
    </ToolArea>
  );
};

export const Panels: React.FC = () => {
  const mode = useGlobal('mode')[0];
  const [selected, setSelected] = useState('Minorin');
  return (
    <Flex direction="column" width="size-3600" gap="size-0">
      {mode === 'Edit' ? (
        <>
          <Tool Title="Transition"></Tool>
          <Tool Title="Camera Work"></Tool>
          <Tool Title="Outline"></Tool>
        </>
      ) : (
        <>
          <Tool Title="Dialogue">
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
            <TextArea minWidth="100%" width="100%" marginTop="size-200" />
          </Tool>
          <Tool Title="Media">
            <Flex direction="row" gap="size-200" wrap>
              <Card Title="Title.mp4" Type="movie"></Card>
              <Card Title="Credit.mp4" Type="movie"></Card>
              <Card Title="BGM1.wav" Type="audio"></Card>
            </Flex>
          </Tool>
        </>
      )}
    </Flex>
  );
};
