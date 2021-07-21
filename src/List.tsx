import styled from 'styled-components';

export const List = styled.li`
  list-style: none;
  margin: var(--spectrum-global-dimension-size-50, var(--spectrum-alias-size-50)) 0;
  padding: var(--spectrum-global-dimension-size-50, var(--spectrum-alias-size-50)) 0;
  ::before {
    content: '';
    display: inline-block;
    width: var(--spectrum-global-dimension-size-225, var(--spectrum-alias-size-225));
    padding-right: var(--spectrum-global-dimension-size-100, var(--spectrum-alias-size-100));
  }
  :hover {
    background-color: var(--spectrum-alias-highlight-hover);
    border-radius: var(--spectrum-global-dimension-size-50, var(--spectrum-alias-size-50));
  }
`;
