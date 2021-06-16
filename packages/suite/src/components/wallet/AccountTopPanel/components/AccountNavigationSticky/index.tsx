import React from 'react';
import AccountNavigation from '../AccountNavigation';
import { Account } from '@wallet-types';
import styled from 'styled-components';
import { AccountStickyContent } from '@suite-components';
import { variables } from '@trezor/components';

const StyledAccountNavigation = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    /* overflow: hidden; */
    padding: 0;
    @media screen and (max-width: calc(${variables.SCREEN_SIZE.XL} - 80px)) {
        padding: 0 13px;
    }
`;

interface Props {
    account?: Account;
}

const AccountNavigationSticky = (props: Props) => {
    const { account } = props;
    if (!account) return null;

    return (
        <StyledAccountNavigation>
            <AccountNavigation
                account={account}
                filterPosition="secondary"
                dataTestSuffix="sticky"
                primaryContent={<AccountStickyContent account={account} />}
            />
        </StyledAccountNavigation>
    );
};

export default AccountNavigationSticky;
