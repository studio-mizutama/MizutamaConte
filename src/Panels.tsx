import React, { useGlobal } from 'reactn';
import styled from 'styled-components';
import { Flex, Heading, Text } from '@adobe/react-spectrum';
import { useT, TranslationKey } from 'i18n';
import ImageAlbum from '@spectrum-icons/workflow/ImageAlbum';
import MovieCamera from '@spectrum-icons/workflow/MovieCamera';
import ViewList from '@spectrum-icons/workflow/ViewList';
import Comment from '@spectrum-icons/workflow/Comment';
import Clock from '@spectrum-icons/workflow/Clock';
import { Transition } from 'Transition';
import { CameraWork } from 'CameraWork';
import { Outline } from 'Outline';
import { Dialogue } from 'Dialogue';
import { Duration } from 'Duration';

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

// Title は icon マップ・レイアウト分岐の安定キー（英語固定）。表示だけをロケールに応じて翻訳する。
const TITLE_KEYS: Record<string, TranslationKey> = {
  Transition: 'panels.transition',
  'Camera Work': 'panels.cameraWork',
  Outline: 'panels.outline',
  Dialogue: 'panels.dialogue',
  Duration: 'panels.duration',
};

const Tool: React.FC<{ Title: string }> = ({ Title, children }) => {
  const t = useT();
  interface Itool {
    [key: string]: JSX.Element;
  }
  const tool: Itool = {
    Transition: <ImageAlbum size="XS" />,
    'Camera Work': <MovieCamera size="XS" />,
    Outline: <ViewList size="XS" />,
    Dialogue: <Comment size="XS" />,
    Duration: <Clock size="XS" />,
  };

  const iconRender = (title: string): JSX.Element => tool[title];
  const titleKey = TITLE_KEYS[Title];

  return (
    <ToolArea style={Title === 'Outline' ? { maxHeight: 'calc(100vh - 580px)' } : { maxHeight: 'calc(100vh - 257px)' }}>
      <Flex direction="row" alignItems="center">
        {iconRender(Title)}
        <Heading level={4} margin="size-200">
          <Text>{titleKey ? t(titleKey) : Title}</Text>
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
        <Tool Title="Duration">
          <Duration />
        </Tool>
        <Tool Title="Dialogue">
          <Dialogue />
        </Tool>
      </div>
    </>
  );
};
