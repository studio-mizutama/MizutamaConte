import React, { useGlobal } from 'reactn';
import { Grid, Heading, View, Flex } from '@adobe/react-spectrum';
import styled from 'styled-components';

const Scroll = styled.div`
  height: calc(100vh - 82px);
  overflow: auto;
`;

const HoverArea = styled.div`
  width: 100%;
  height: 100%;
  :hover {
    border: 2px solid var(--spectrum-alias-border-color-focus);
    border-radius: var(--spectrum-global-dimension-size-50, var(--spectrum-alias-size-50));
  }
`;

const MyTextArea = styled.textarea`
  position: absolute;
  top: 2px;
  height: calc(100% - 4px);
  width: calc(100% - 4px);
  resize: none;
  background: none;
  margin: 0;
  padding: 0;
  border: none;

  :focus {
    outline: 2px solid var(--spectrum-alias-border-color-focus);
    border-radius: var(--spectrum-global-dimension-size-50, var(--spectrum-alias-size-50));
  }
`;

const PictureArea: React.FC = ({ children }) => {
  const tool = useGlobal('tool')[0] as Set<string>;
  return <>{tool.has('Crop') ? <HoverArea>{children}</HoverArea> : <>{children}</>}</>;
};

export const Conte: React.FC = () => {
  const tool = useGlobal('tool')[0] as Set<string>;

  const escKeyDown = (e: React.KeyboardEvent) => {
    const activeElement = document.activeElement as HTMLElement;
    e.key === 'Escape' && activeElement.blur();
  };

  return (
    <>
      <Grid
        columns={['size-900', 'size-2400', 'auto', 'auto', 'size-1600']}
        rows={['size-500']}
        height="size-500"
        gap="size-0"
      >
        <Heading alignSelf="center" justifySelf="center">
          CUT
        </Heading>
        <Heading alignSelf="center" justifySelf="center">
          PICTURE
        </Heading>
        <Heading alignSelf="center" justifySelf="center">
          ACTION
        </Heading>
        <Heading alignSelf="center" justifySelf="center">
          DIALOGUE
        </Heading>
        <Heading alignSelf="center" justifySelf="center">
          TIME
        </Heading>
      </Grid>

      <Scroll style={{}}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((number) => (
          <View backgroundColor="gray-100">
            <div className={tool.has('Select') ? 'hover' : ''}>
              <Grid
                columns={['size-900', 'size-2400', 'auto', 'auto', 'size-1600']}
                areas={['cut picture action dialogue time']}
                rows={['108px']}
                gap="size-0"
                marginBottom="size-25"
              >
                <View gridArea="cut" height="100%" width="100%">
                  <Flex direction="column" alignItems="center">
                    <Heading>{('00' + number).slice(-3)}</Heading>
                  </Flex>
                </View>
                <PictureArea>
                  <View gridArea="picture" height="100%" width="100%"></View>
                </PictureArea>

                <View gridArea="action" height="100%" width="100%" position="relative">
                  <MyTextArea
                    className={tool.has('Text') ? 'hover' : ''}
                    disabled={!tool.has('Text')}
                    onKeyDown={escKeyDown}
                  ></MyTextArea>
                </View>

                <View gridArea="dialogue" height="100%" width="100%" position="relative">
                  <MyTextArea
                    className={tool.has('Text') ? 'hover' : ''}
                    disabled={!tool.has('Text')}
                    onKeyDown={escKeyDown}
                  ></MyTextArea>
                </View>

                <View gridArea="time" height="100%" width="100%" position="relative">
                  <MyTextArea
                    className={tool.has('Text') ? 'hover' : ''}
                    disabled={!tool.has('Text')}
                    onKeyDown={escKeyDown}
                  ></MyTextArea>
                </View>
              </Grid>
            </div>
          </View>
        ))}
      </Scroll>
    </>
  );
};
