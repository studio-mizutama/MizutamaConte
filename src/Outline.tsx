import React from 'reactn';
import { Accordion } from 'Accordion';
import { List } from 'List';

export const Outline: React.FC = () => {
  return (
    <>
      <Accordion labelName="Scene1">
        <List>Cut1</List>
        <List>Cut2</List>
        <Accordion labelName="Cut3">
          <List>c001.psd</List>
          <List>b001.psd</List>
        </Accordion>
      </Accordion>
      <Accordion labelName="Scene2">
        <List>Cut3</List>
        <List>Cut4 </List>
      </Accordion>
    </>
  );
};
