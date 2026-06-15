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

/** 見出し(LabelHover)に spread する DOM props。並べ替え用の draggable / drag ハンドラを渡す入口。 */
type HeaderProps = React.HTMLAttributes<HTMLDivElement> & { draggable?: boolean };

const Label: React.FC<{ labelFor: string; headerProps?: HeaderProps }> = ({ labelFor, headerProps, children }) => (
  <LabelHover {...headerProps}>
    <label htmlFor={labelFor}>{children}</label>
  </LabelHover>
);

export const Accordion: React.FC<{ labelName: string; headerProps?: HeaderProps }> = ({
  labelName,
  headerProps,
  children,
}) => {
  const [toggle, setToggle] = useState(false);
  return (
    <>
      <Toggle type="checkbox" id={labelName} checked={toggle} onChange={() => setToggle(!toggle)} />

      {/* 見出しだけをシーン並べ替えのドラッグ取っ手にする（headerProps を spread）。
          開閉は内側 <label> のクリックで行うため、見出し draggable と共存できる。 */}
      <Label labelFor={labelName} headerProps={headerProps}>
        <Flex direction="row" gap="size-100" alignItems="center">
          {toggle ? <ChevronDown size="S" /> : <ChevronRight size="S" />}
          <Text>{labelName}</Text>
        </Flex>
      </Label>

      <Ul style={{ display: `${toggle ? 'block' : 'none'}` }}>{children}</Ul>
    </>
  );
};
