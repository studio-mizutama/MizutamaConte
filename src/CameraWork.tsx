import React from 'reactn';
import { Flex, TextField } from '@adobe/react-spectrum';
import { LabelTop, LabelSideL, LabelSideM } from 'Label';

export const CameraWork: React.FC = () => {
  return (
    <>
      <LabelTop>Position</LabelTop>
      <Flex direction="row" gap="size-200" wrap>
        <>
          {[
            ['In', 'X', 'Y'],
            ['Out', 'X', 'Y'],
            ['Scale', 'In', 'Out'],
          ].map((array: string[]) => (
            <>
              <LabelSideL>{array[0]}</LabelSideL>
              <LabelSideM>{array[1]}</LabelSideM>
              <TextField width="68px"></TextField>
              <LabelSideM>{array[2]}</LabelSideM>
              <TextField width="68px"></TextField>
            </>
          ))}
        </>
      </Flex>
    </>
  );
};
