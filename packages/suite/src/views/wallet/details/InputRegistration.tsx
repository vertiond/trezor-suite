import React, { useState } from 'react';
import styled from 'styled-components';
import { Card } from '@suite-components';
import { useCoinJoinContext } from '@wallet-hooks/useCoinJoinForm';
import { variables, Select } from '@trezor/components';
import UtxoSelectionBase from './UtxoSelection';
import * as W from '@wallet-actions/wabisabiApi';
import { bufferutils } from '@trezor/utxo-lib';

const StyledCard = styled(Card)`
    flex-direction: column;
`;

const Title = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_DARK_GREY};
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;

const buildRoundOption = (round: any) =>
    ({
        value: round.id,
        label: `${round.phase} ${round.id} `,
    } as const);

type Option = ReturnType<typeof buildRoundOption>;

const InputRegistration = () => {
    const { account, enabled, getValues, toggleUtxoSelection, coinJoinState } =
        useCoinJoinContext();
    const options = coinJoinState.map(buildRoundOption);
    const [currentRound, setCurrentRound] = useState<Option>(options[0]);

    if (!enabled) return null;

    const selectedUtxos = getValues('selectedUtxos') || [];

    const register = async (utxo: any) => {
        toggleUtxoSelection(utxo);

        const buf = Buffer.allocUnsafe(36);
        const b = new bufferutils.BufferWriter(buf);
        b.writeSlice(bufferutils.reverseBuffer(Buffer.from(utxo.txid, 'hex')));
        b.writeUInt32(utxo.vout);

        const proof = await W.getOwnershipProof(utxo, currentRound.value);

        await W.inputRegistration(
            currentRound.value,
            buf.toString('hex'),
            proof.payload.ownership_proof,
        );
    };

    return (
        <StyledCard>
            <Title>
                <Select
                    label={<span>Round selection</span>}
                    isSearchable={false}
                    isClearable={false}
                    value={currentRound}
                    options={options}
                    onChange={(option: Option) => setCurrentRound(option)}
                />
            </Title>
            {/* <Description>Description how to use coins selection</Description> */}
            <UtxoSelectionBase
                utxos={account.utxo!}
                selectedUtxos={selectedUtxos!}
                symbol={account.symbol}
                toggleUtxoSelection={register}
            />
        </StyledCard>
    );
};

export default InputRegistration;
