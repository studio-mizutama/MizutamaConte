import React, { useGlobal } from 'reactn';
import { Flex, TextField } from '@adobe/react-spectrum';
import { LabelTop, LabelSideL, LabelSideM } from 'Label';

export const CameraWork: React.FC = () => {
  const cut = useGlobal('cut')[0];
  return (
    <>
      <LabelTop>Position</LabelTop>
      <Flex direction="row" gap="size-200" wrap>
        <LabelSideL>In</LabelSideL>
        <LabelSideM>X</LabelSideM>
        <TextField
          width="68px"
          isQuiet
          value={cut.cameraWork?.position ? cut.cameraWork?.position?.in.x.toString() : ''}
        ></TextField>
        <LabelSideM>Y</LabelSideM>
        <TextField
          width="68px"
          isQuiet
          value={cut.cameraWork?.position ? cut.cameraWork?.position?.in.y.toString() : ''}
        ></TextField>
        <LabelSideL>Out</LabelSideL>
        <LabelSideM>X</LabelSideM>
        <TextField
          width="68px"
          isQuiet
          value={cut.cameraWork?.position ? cut.cameraWork?.position?.out.x.toString() : ''}
        ></TextField>
        <LabelSideM>Y</LabelSideM>
        <TextField
          width="68px"
          isQuiet
          value={cut.cameraWork?.position ? cut.cameraWork?.position?.out.y.toString() : ''}
        ></TextField>
        <LabelSideL>Scale</LabelSideL>
        <LabelSideM>In</LabelSideM>
        <TextField
          width="68px"
          isQuiet
          value={cut.cameraWork?.scale ? cut.cameraWork?.scale?.in.toString() : ''}
        ></TextField>
        <LabelSideM>Out</LabelSideM>
        <TextField
          width="68px"
          isQuiet
          value={cut.cameraWork?.scale ? cut.cameraWork?.scale?.out.toString() : ''}
        ></TextField>
      </Flex>
    </>
  );
};
