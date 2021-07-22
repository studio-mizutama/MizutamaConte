import React, { useGlobal, useState, useEffect } from 'reactn';
import { Grid, Heading, View, Flex } from '@adobe/react-spectrum';
import styled from 'styled-components';
import { readPsd, Psd } from 'ag-psd';

const Scroll = styled.div`
  height: calc(100vh - 82px);
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
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

const { api } = window;

const Cut: React.FC = () => {
  const tool = useGlobal('tool')[0] as Set<string>;

  const prtPsd: Psd = { width: 1, height: 1 };
  const [psds, setPsds] = useState([prtPsd]);

  const escKeyDown = (e: React.KeyboardEvent) => {
    const activeElement = document.activeElement as HTMLElement;
    e.key === 'Escape' && activeElement.blur();
  };

  useEffect(() => {
    const f = async () => {
      try {
        const psdfiles = await api.loadPSD();
        setPsds(psdfiles.map((psdfile) => readPsd(psdfile)));
      } catch (e) {
        alert(e);
      }
    };
    f();
  }, [setPsds]);

  return (
    <>
      {psds.map((psd, index) => {
        const number = index + 1;
        //const src = psd.canvas?.toDataURL();
        //const ctx = psd.canvas?.getContext('2d');
        //ctx?.scale(0.1, 0.1);
        return (
          <View backgroundColor="gray-100">
            <div className={tool.has('Select') ? 'hover' : ''}>
              <Grid
                columns={['size-900', 'size-3600', 'auto', 'auto', 'size-1600']}
                areas={['cut picture action dialogue time']}
                gap="size-0"
                height="auto"
                marginBottom="size-25"
              >
                <View gridArea="cut" width="100%" height="auto">
                  <Flex direction="column" alignItems="center">
                    <Heading>{('00' + number).slice(-3)}</Heading>
                  </Flex>
                </View>
                <View gridArea="picture" width="100%" height="auto">
                  {psd.children
                    ?.filter((child, index) => index !== 0)
                    .map((child) => {
                      const src = child.canvas?.toDataURL('image/png', 0.4);
                      return (
                        <div
                          style={{
                            height: `${child.canvas && child.canvas.height * 0.12}px`,
                            width: `${child.canvas && child.canvas.width * 0.12}px`,
                            backgroundColor: '#fff',
                          }}
                        >
                          <img style={{ transform: 'scale(0.12)', transformOrigin: 'left top' }} src={src} alt="cut" />
                        </div>
                      );
                    })}
                </View>

                <View gridArea="action" width="100%" position="relative" height="auto">
                  <MyTextArea
                    className={tool.has('Text') ? 'hover' : ''}
                    disabled={!tool.has('Text')}
                    onKeyDown={escKeyDown}
                  ></MyTextArea>
                </View>

                <View gridArea="dialogue" width="100%" position="relative" height="auto">
                  <MyTextArea
                    className={tool.has('Text') ? 'hover' : ''}
                    disabled={!tool.has('Text')}
                    onKeyDown={escKeyDown}
                  ></MyTextArea>
                </View>

                <View gridArea="time" width="100%" position="relative" height="auto">
                  <MyTextArea
                    className={tool.has('Text') ? 'hover' : ''}
                    disabled={!tool.has('Text')}
                    onKeyDown={escKeyDown}
                  ></MyTextArea>
                </View>
              </Grid>
            </div>
          </View>
        );
      })}
    </>
  );
};

export const Conte: React.FC = () => {
  return (
    <>
      <Grid
        columns={['size-900', 'size-3600', 'auto', 'auto', 'size-1600']}
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

      <Scroll>
        <Cut />
      </Scroll>
    </>
  );
};
