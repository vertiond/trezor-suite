import React, { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Select } from '@trezor/components';
import { components } from 'react-select';
import styled from 'styled-components';
import { useSendFormContext } from '@wallet-hooks';
import { Account } from '@wallet-types';
import { Output } from '@wallet-types/sendForm';

interface Option {
    label: string;
    value: string | null;
    fingerprint: string | undefined;
}

export const buildTokenOptions = (account: Account) => {
    const result: Option[] = [
        {
            value: null,
            fingerprint: undefined,
            label: account.symbol.toUpperCase(),
        },
    ];

    if (account.tokens) {
        account.tokens.forEach(token => {
            const tokenName = token.symbol || 'N/A';
            result.push({
                value: token.address,
                label: tokenName.toUpperCase(),
                fingerprint: token.name,
            });
        });
    }

    return result;
};

interface Props {
    output: Partial<Output>;
    outputId: number;
}

const OptionValueName = styled.div`
    max-width: 200px;
    text-overflow: ellipsis;
    overflow: hidden;
    width: 160px;
    height: 1.2em;
    white-space: nowrap;
    margin: 5px 0;
`;

const OptionWrapper = styled.div``;
const OptionValue = styled.div`
    font-variant-numeric: slashed-zero tabular-nums;
`;

const OptionEmptyName = styled.div`
    font-style: italic;
`;

const TokenSelect = ({ output, outputId }: Props) => {
    const {
        account,
        clearErrors,
        control,
        setAmount,
        getValues,
        getDefaultValue,
        toggleOption,
        composeTransaction,
        watch,
    } = useSendFormContext();

    const tokenInputName = `outputs[${outputId}].token`;
    const amountInputName = `outputs[${outputId}].amount`;
    const tokenValue = getDefaultValue(tokenInputName, output.token);
    const isSetMaxActive = getDefaultValue('setMaxOutputId') === outputId;
    const dataEnabled = getDefaultValue('options', []).includes('ethereumData');
    const options = buildTokenOptions(account);

    // Amount needs to be re-validated again AFTER token change propagation (decimal places, available balance)
    // watch token change and use "useSendFormFields.setAmount" util for validation (if amount is set)
    // if Amount is not valid 'react-hook-form' will set an error to it, and composeTransaction will be prevented
    // N0TE: do this conditionally only for ETH and when set-max is not enabled
    const tokenWatch = watch(tokenInputName, null);
    useEffect(() => {
        if (account.networkType === 'ethereum' && !isSetMaxActive) {
            const amountValue = getValues(`outputs[${outputId}].amount`) as string;
            if (amountValue) setAmount(outputId, amountValue);
        }
    }, [outputId, tokenWatch, setAmount, getValues, account.networkType, isSetMaxActive]);

    const getShortFingerprint = (fingerprint: string) => {
        if (fingerprint) {
            const firstPart = fingerprint.substring(0, 10);
            const lastPart = fingerprint.substring(fingerprint.length - 10);

            return `${firstPart} ... ${lastPart}`;
        }

        return null;
    };

    const CardanoOption = ({ tokenInputName, ...optionProps }: any) => (
        <components.Option
            {...optionProps}
            innerProps={{
                ...optionProps.innerProps,
                'data-test': `${tokenInputName}/option/${optionProps.value}`,
            }}
        >
            <OptionWrapper>
                <OptionValueName>
                    {optionProps.data.fingerprint &&
                    optionProps.data.label.toLowerCase() ===
                        optionProps.data.fingerprint.toLowerCase() ? (
                        // eslint-disable-next-line react/jsx-indent
                        <OptionEmptyName>No name</OptionEmptyName>
                    ) : (
                        optionProps.data.label
                    )}
                </OptionValueName>
                <OptionValue>{getShortFingerprint(optionProps.data.fingerprint)}</OptionValue>
            </OptionWrapper>
        </components.Option>
    );

    const customComponents =
        account.networkType === 'cardano' ? { Option: CardanoOption } : undefined;

    return (
        <Controller
            control={control}
            name={tokenInputName}
            data-test={tokenInputName}
            defaultValue={tokenValue}
            render={({ onChange }) => (
                <Select
                    options={options}
                    minWidth={account.networkType === 'cardano' ? '200px' : '58px'}
                    isSearchable
                    isDisabled={options.length === 1} // disable when account has no tokens to choose from
                    hideTextCursor
                    value={options.find(o => o.value === tokenValue)}
                    isClearable={false}
                    components={customComponents}
                    isClean
                    onChange={(selected: Option) => {
                        // change selected value
                        onChange(selected.value);
                        // clear errors in Amount input
                        clearErrors(amountInputName);
                        // remove Amount if isSetMaxActive or ETH data options are enabled
                        if (isSetMaxActive || dataEnabled) setAmount(outputId, '');
                        // remove ETH data option
                        if (dataEnabled) toggleOption('ethereumData');
                        // compose (could be prevented because of Amount error from re-validation above)
                        composeTransaction(amountInputName);
                    }}
                />
            )}
        />
    );
};

export default TokenSelect;
