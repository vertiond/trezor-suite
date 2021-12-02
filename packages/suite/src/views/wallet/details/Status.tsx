import React, { useCallback } from 'react';
import styled from 'styled-components';
import { P, Switch } from '@trezor/components';
import { Card, CollapsibleBox } from '@suite-components';
import { Row } from '@suite-components/Settings';
import * as W from '@wallet-actions/wabisabiApi';
import useInterval from 'react-use/lib/useInterval';
import { useCoinJoinContext } from '@wallet-hooks/useCoinJoinForm';

const StyledCard = styled(Card)`
    flex-direction: column;
    margin-bottom: 12px;
`;

const StyledRow = styled(Row)`
    display: flex;
    padding-top: 0;
    flex-direction: row;
`;

const Details = styled(Row)`
    display: flex;
    padding-top: 0;
    flex-direction: column;
`;

const Status = () => {
    const { enabled, setEnabled, coinJoinState, setCoinJoinState } = useCoinJoinContext();

    const tick = useCallback(async () => {
        const status = await W.getStatus();
        setCoinJoinState(status || []);
    }, [setCoinJoinState]);

    useInterval(tick, enabled ? 3000 : null);

    const toggleCoinJoin = async () => {
        setEnabled(!enabled);
        if (!enabled) {
            // const result = await W.authorize();
            // if (result.success) {
            //     tick();
            // }
            tick();
        } else {
            setCoinJoinState([]);
        }
    };

    return (
        <StyledCard largePadding>
            <StyledRow>
                CoinJoin status
                <Switch onChange={toggleCoinJoin} checked={enabled} />
            </StyledRow>
            {coinJoinState.length > 0 && (
                <CollapsibleBox heading={() => <div>Available rounds</div>} variant="small">
                    {coinJoinState.map(round => (
                        <Details key={round.id}>
                            <P>ID: {round.id}</P>
                            <P>phase: {round.phase}</P>
                            <P>state: {round.coinjoinState.State}</P>
                            <P>Registred inputs: {round.coinjoinState.inputs.length}</P>
                            <P>Registration ends: {round.inputRegistrationEnd}</P>
                        </Details>
                    ))}
                </CollapsibleBox>
            )}
        </StyledCard>
    );
};

// {state && (
//     <Details>
//         <P>Id: {state.id}</P>
//         <P>Registration ends: {state.inputRegistrationEnd}</P>
//         <P>Registred inputs: {state.coinjoinState.inputs.length}</P>
//         <P>Min input value: {state.coinjoinState.parameters.allowedInputAmounts.min}</P>
//         {/* <P>Max input value: {response.coinjoinState.parameters.allowedInputAmounts.max}</P> */}
//         <P>
//             Min output value: {state.coinjoinState.parameters.allowedOutputAmounts.min}
//         </P>
//         {/* <P>Max output value: {response.coinjoinState.parameters.allowedOutputAmounts.max}</P> */}
//         <P>Fee rate: {state.coinjoinState.parameters.feeRate}</P>
//         <P>Min realy fee: {state.coinjoinState.parameters.minRelayTxFee}</P>
//     </Details>
// )}

export default Status;
