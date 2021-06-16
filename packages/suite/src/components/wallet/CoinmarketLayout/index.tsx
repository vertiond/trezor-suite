import { WalletLayout, CoinmarketFooter } from '@wallet-components';
import { variables, Card } from '@trezor/components';
import { useSelector } from '@suite-hooks';
import React, { ReactNode } from 'react';
import styled from 'styled-components';
import Navigation from './components/Navigation';
import AccountTransactions from './components/AccountTransactions';
import { Translation } from '@suite-components';


const Content = styled.div`
    padding: 29px 41px;
`;

const StyledTitle = styled.h2`
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${props => props.theme.TYPE_DARK_GREY};
    padding: 10px 0 30px 0;
`;

const BottomContent = styled.div``;

interface Props {
    children: ReactNode;
}

const CoinmarketLayout = ({ children }: Props) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    return (
        <WalletLayout title="TR_NAV_TRADE" account={selectedAccount}>
        <StyledTitle><Translation id="TR_NAV_TRADE" /></StyledTitle>
            <Card noPadding>
                <Navigation />
                <Content>{children}</Content>
            </Card>
            <BottomContent>
                <AccountTransactions />
                <CoinmarketFooter />
            </BottomContent>
        </WalletLayout>
    );
};

export default CoinmarketLayout;
