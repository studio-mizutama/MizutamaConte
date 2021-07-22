import React from 'reactn';
import styled from 'styled-components';
import Asset from '@spectrum-icons/workflow/Asset';
import Audio from '@spectrum-icons/workflow/Audio';
import { Text } from '@adobe/react-spectrum';

const CardArea = styled.div`
  width: 118px;
  height: var(--spectrum-global-dimension-size-1600, var(--spectrum-alias-size-1600));
  border-radius: var(--spectrum-global-dimension-size-50, var(--spectrum-alias-size-50));
  border: 1px solid var(--spectrum-alias-border-color);
  background-color: var(--spectrum-alias-appframe-border-color);
  display: flex;
  flex-flow: column;
  :hover {
    color: var(--spectrum-alias-text-color-hover);
    border-color: var(--spectrum-alias-border-color-hover);
  }
`;

const IconArea = styled.div`
  height: 50%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TitleArea = styled(IconArea)`
  background-color: var(--spectrum-tray-background-color);
  border-bottom-left-radius: var(--spectrum-global-dimension-size-50, var(--spectrum-alias-size-50));
  border-bottom-right-radius: var(--spectrum-global-dimension-size-50, var(--spectrum-alias-size-50));
`;

export const Card: React.FC<{ Title: string; Type: string }> = ({ Title, Type }) => {
  interface Itype {
    [key: string]: JSX.Element;
  }
  const type: Itype = {
    movie: <Asset size="S" />,
    audio: <Audio size="S" />,
  };

  const iconRender = (mediatype: string): JSX.Element => type[mediatype];

  return (
    <CardArea>
      <IconArea>{iconRender(Type)}</IconArea>
      <TitleArea>
        <Text>{Title}</Text>
      </TitleArea>
    </CardArea>
  );
};
