import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { variables, Select, Input, Button } from '@trezor/components';
import { Card } from '@suite-components';
import { useSelector } from '@suite-hooks';
import type { AccountAddress } from 'trezor-connect';

const StyledCard = styled(Card)`
    flex-direction: column;
    margin: 12px 0px;
`;

const Row = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_DARK_GREY};
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;

const FAUCET_URL = 'http://127.0.0.1:8080/';

export const generateBlock = () =>
    fetch(`${FAUCET_URL}generate_block`, {
        method: 'GET',
    });

export const sendToAddress = (address: string, amount: string) =>
    fetch(
        `${FAUCET_URL}send_to_address?${new URLSearchParams({
            address,
            amount,
        })}`,
        {
            method: 'GET',
        },
    );

const buildAddressOption = (address: AccountAddress) =>
    ({
        value: address.address,
        label: `${address.path} ${address.address}`,
    } as const);

type Option = ReturnType<typeof buildAddressOption>;

const Faucet = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const amountRef = useRef<HTMLInputElement | null>(null);
    const [address, setAddress] = useState<Option | null>(null);

    if (!selectedAccount.account || !selectedAccount.account.addresses) return null;

    const options = selectedAccount.account.addresses.unused.map(buildAddressOption);
    const selected = address || options[0];

    return (
        <StyledCard>
            <Row>
                <Select
                    label={<span>Faucet</span>}
                    isSearchable={false}
                    isClearable={false}
                    value={selected}
                    options={options}
                    onChange={(option: Option) => setAddress(option)}
                />
            </Row>
            <Row>
                <Input noTopLabel noError innerRef={amountRef} />
                <Button
                    disabled={!selected}
                    onClick={() => {
                        if (selected && amountRef.current?.value) {
                            sendToAddress(selected.value, amountRef.current?.value);
                        }
                    }}
                >
                    Receive coins
                </Button>
            </Row>
            <Row>
                <Button onClick={() => generateBlock()}>Generate block</Button>
            </Row>
        </StyledCard>
    );
};

export default Faucet;
