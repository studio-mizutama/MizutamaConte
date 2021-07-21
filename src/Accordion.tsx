import React, { useState } from 'reactn';
import styled from 'styled-components';
import { Flex, Text } from '@adobe/react-spectrum';
import ChevronRight from '@spectrum-icons/workflow/ChevronRight';
import ChevronDown from '@spectrum-icons/workflow/ChevronDown';

const LabelHover = styled.div`
  width: 100%;
  margin: var(--spectrum-global-dimension-size-50, var(--spectrum-alias-size-50)) 0;
  padding: var(--spectrum-global-dimension-size-50, var(--spectrum-alias-size-50)) 0;
  :hover {
    background-color: var(--spectrum-alias-highlight-hover);
    border-radius: var(--spectrum-global-dimension-size-50, var(--spectrum-alias-size-50));
  }
`;

const Toggle = styled.input`
  display: none;
`;

const Ul = styled.ul`
  padding-left: var(--spectrum-global-dimension-size-300, var(--spectrum-alias-size-300));
  margin: 0;
`;

const Label: React.FC<{ labelFor: string }> = ({ labelFor, children }) => (
  <LabelHover>
    <label htmlFor={labelFor}>{children}</label>
  </LabelHover>
);

export const Accordion: React.FC<{ labelName: string }> = ({ labelName, children }) => {
  const [toggle, setToggle] = useState(false);
  return (
    <>
      <Toggle type="checkbox" id={labelName} checked={toggle} onClick={() => setToggle(!toggle)} />

      <Label labelFor={labelName}>
        <Flex direction="row" gap="size-100" alignItems="center">
          {toggle ? <ChevronDown size="S" /> : <ChevronRight size="S" />}
          <Text>{labelName}</Text>
        </Flex>
      </Label>

      <Ul>{toggle && children}</Ul>
    </>
  );
};
