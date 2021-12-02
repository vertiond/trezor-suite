import React from 'react';
import styled from 'styled-components';
import { P, Button } from '@trezor/components';
import { WalletLayout } from '@wallet-components';
import { useSelector } from '@suite-hooks';
import { Card } from '@suite-components';
import { Row } from '@suite-components/Settings';
import { CARD_PADDING_SIZE } from '@suite-constants/layout';
import * as W from '@wallet-actions/wabisabiApi';
import Status from './Status';
import InputRegistration from './InputRegistration';
import Faucet from './Faucet';
import { useCoinJoin, CoinJoinContext } from '@wallet-hooks/useCoinJoinForm';

const StyledCard = styled(Card)`
    flex-direction: column;
    padding-top: ${CARD_PADDING_SIZE};
    padding-bottom: ${CARD_PADDING_SIZE};
`;

const StyledRow = styled(Row)`
    display: flex;
    padding-top: 0;
    flex-direction: column;

    button {
        width: 200px;
        margin-bottom: 12px;
    }
`;

const Details = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const sendContextValues = useCoinJoin({});

    if (!sendContextValues.account) {
        return <WalletLayout title="TR_ACCOUNT_DETAILS_HEADER" account={selectedAccount} />;
    }

    return (
        <WalletLayout
            title="TR_ACCOUNT_DETAILS_HEADER"
            account={selectedAccount}
            showEmptyHeaderPlaceholder
        >
            <CoinJoinContext.Provider value={sendContextValues}>
                <Status />
                <InputRegistration />
                <Faucet />
                <StyledCard largePadding>
                    <StyledRow>
                        <P>Wabisabi API</P>
                        <Button onClick={() => W.connectionConfirmation()}>CONF</Button>
                    </StyledRow>
                    <StyledRow>
                        <P>Trezor actions</P>
                        <Button onClick={() => W.authorize()}>Authorize CoinJoin</Button>
                        <Button onClick={() => W.getOwnershipId()}>Ownership id</Button>
                    </StyledRow>
                </StyledCard>
            </CoinJoinContext.Provider>
        </WalletLayout>
    );
};

export default Details;
