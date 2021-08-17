import React, { useEffect } from 'react';
import styled from 'styled-components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { Card } from '@suite-components';
import { useCardanoStakingContext } from '@wallet-hooks/useCardanoStaking';
import { Button, variables, H1, Icon } from '@trezor/components';
import { Translation } from '@suite-components/Translation';

const StyledCard = styled(Card)`
    display: flex;
    flex-direction: column;
`;

const Column = styled.div`
    display: flex;
    flex-direction: column;
`;

const ColumnDeposit = styled(Column)`
    margin-left: 30px;
`;

const StyledH1 = styled(H1)`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 5px;
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-top: 10px;
`;

const RowLong = styled.div`
    display: flex;
    flex-direction: row;
    width: 100%;
    margin-top: 10px;
`;

const Left = styled.div`
    display: flex;
    flex-direction: column;
`;

const Right = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    margin-top: 40px;
`;

const Heading = styled.div`
    padding-left: 5px;
`;

const Text = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-bottom: 12px;
    margin-top: 12px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    &:last-child {
        margin-bottom: 0px;
    }
`;

const ValueSmall = styled.div`
    display: flex;
    margin-top: 10px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.BIG};
`;

const Title = styled.div`
    display: flex;
    margin-top: 15px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const Delegate = () => {
    const {
        address,
        delegate,
        account,
        deposit,
        composeTx,
        fee,
        loading,
    } = useCardanoStakingContext();

    useEffect(() => {
        if (!fee) {
            composeTx();
        }
    }, [fee, composeTx]);

    return (
        <StyledCard>
            <StyledH1>
                <Icon icon="CROSS" size={25} />
                <Heading>
                    <Translation id="TR_STAKING_STAKE_TITLE" />
                </Heading>
            </StyledH1>
            <Text>
                <Translation id="TR_STAKING_STAKE_DESCRIPTION" />
            </Text>
            <Row>
                <Left>
                    <Title>
                        <Translation id="TR_STAKING_STAKE_ADDRESS" />
                    </Title>
                    <ValueSmall>{address}</ValueSmall>
                </Left>
                <RowLong>
                    <Column>
                        <Title>
                            <Translation id="TR_STAKING_DEPOSIT" />
                        </Title>
                        <ValueSmall>
                            {formatNetworkAmount(deposit || '0', account.symbol)}{' '}
                            {account.symbol.toUpperCase()}
                        </ValueSmall>
                    </Column>
                    <ColumnDeposit>
                        <Title>
                            <Translation id="TR_STAKING_FEE" />
                        </Title>
                        <ValueSmall>
                            {formatNetworkAmount(fee || '0', account.symbol)}{' '}
                            {account.symbol.toUpperCase()}
                        </ValueSmall>
                    </ColumnDeposit>
                </RowLong>
            </Row>
            <Right>
                <Button isLoading={loading} onClick={() => delegate()} icon="T1">
                    <Translation id="TR_STAKING_DELEGATE" />
                </Button>
            </Right>
        </StyledCard>
    );
};

export default Delegate;
