import React, { useGlobal } from 'reactn';
import styled from 'styled-components';
import { Flex, Heading, Text } from '@adobe/react-spectrum';
import ImageAlbum from '@spectrum-icons/workflow/ImageAlbum';
import MovieCamera from '@spectrum-icons/workflow/MovieCamera';
import ViewList from '@spectrum-icons/workflow/ViewList';
import Comment from '@spectrum-icons/workflow/Comment';
import Asset from '@spectrum-icons/workflow/Asset';
import { Transition } from 'Transition';
import { CameraWork } from 'CameraWork';
import { Outline } from 'Outline';
import { Media } from 'Media';
import { Dialogue } from 'Dialogue';

const ToolArea = styled.div`
  padding-left: var(--spectrum-global-dimension-size-200, var(--spectrum-alias-size-200));
  padding-right: var(--spectrum-global-dimension-size-200, var(--spectrum-alias-size-200));
  padding-bottom: var(--spectrum-global-dimension-size-200, var(--spectrum-alias-size-200));
  border-bottom: 2px solid var(--spectrum-alias-appframe-border-color);
  user-select: none;
  height: fit-content;
  &:last-of-type {
    overflow: auto;
  }
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
    <ToolArea style={Title === 'Outline' ? { maxHeight: 'calc(100vh - 580px)' } : { maxHeight: 'calc(100vh - 257px)' }}>
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
  return (
    <>
      <div style={mode === 'Edit' ? { display: 'block', height: '100%', overflow: 'hidden' } : { display: 'none' }}>
        <Tool Title="Transition">
          <Transition />
        </Tool>
        <Tool Title="Camera Work">
          <CameraWork />
        </Tool>
        <Tool Title="Outline">
          <Outline />
        </Tool>
      </div>
      <div style={mode === 'Preview' ? { display: 'block' } : { display: 'none' }}>
        <Tool Title="Dialogue">
          <Dialogue />
        </Tool>

        <Tool Title="Media">
          <Media />
        </Tool>
      </div>
    </>
  );
};
