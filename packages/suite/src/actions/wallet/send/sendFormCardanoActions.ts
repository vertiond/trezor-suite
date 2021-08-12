/* eslint-disable no-bitwise */
import TrezorConnect from 'trezor-connect';
import {
    getAddressType,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
} from '@wallet-utils/cardanoUtils';
import { Account } from '@wallet-types';
import { networkAmountToSatoshi } from '@wallet-utils/accountUtils';
import * as notificationActions from '@suite-actions/notificationActions';
import {
    FormState,
    UseSendFormState,
    PrecomposedLevelsCardano,
    PrecomposedTransactionCardano,
} from '@wallet-types/sendForm';
import { Dispatch, GetState } from '@suite-types';
import BigNumber from 'bignumber.js';

export const composeTransaction = (
    formValues: FormState,
    formState: UseSendFormState,
) => (): PrecomposedLevelsCardano | void => {
    const { account, feeInfo } = formState;
    if (!account.addresses || !account.utxo) return;
    const fee = '170000';
    const utxosCopy = account.utxo.map(u => ({ ...u }));
    const sortedUtxos = utxosCopy.sort((utxo1, utxo2) =>
        new BigNumber(utxo2.amount).comparedTo(utxo1.amount),
    );

    const resultUtxo: Account['utxo'] = [];
    const totalOutputAmount = formValues.outputs.reduce(
        (acc, currentValues) =>
            acc.plus(networkAmountToSatoshi(currentValues.amount, account.symbol)),
        new BigNumber('0'),
    );

    const totalOutputWithFee = totalOutputAmount.plus(fee);
    let totalUsedUtxoAmount = new BigNumber(0);

    sortedUtxos.forEach(utxo => {
        if (totalUsedUtxoAmount.isLessThanOrEqualTo(totalOutputWithFee)) {
            totalUsedUtxoAmount = totalUsedUtxoAmount.plus(utxo.amount);
            resultUtxo.push(utxo);
        }
    });

    const inputs = resultUtxo.map(utxo => ({
        path: utxo.path,
        prev_hash: utxo.txid,
        prev_index: utxo.vout,
    }));

    const changeAddress = account.addresses.unused[0];
    const changeOutput = {
        type: 'change',
        address: changeAddress.address,
        amount: totalUsedUtxoAmount.minus(totalOutputWithFee).toString(),
        addressParameters: {
            path: changeAddress.path,
            addressType: getAddressType(account.accountType),
            stakingPath: getStakingPath(account.accountType, account.index),
        },
        token_bundle: [],
    };

    const outputs = formValues.outputs
        .map(o => ({
            address: o.address,
            amount: networkAmountToSatoshi(o.amount, account.symbol),
            token_bundle: [],
        }))
        .concat(changeOutput);

    return {
        normal: {
            type: 'final',
            fee,
            feePerByte: '0.44',
            bytes: 1,
            totalSpent: totalOutputWithFee.toString(),
            max: undefined,
            transaction: {
                inputs,
                outputs,
            },
        },
    };
};

export const signTransaction = (
    formValues: FormState,
    transactionInfo: PrecomposedTransactionCardano,
) => async (dispatch: Dispatch, getState: GetState) => {
    const { selectedAccount } = getState().wallet;
    const { device } = getState().suite;

    console.log('formValues', formValues);

    if (
        selectedAccount.status !== 'loaded' ||
        !device ||
        !transactionInfo ||
        transactionInfo.type !== 'final'
    )
        return;

    const { account } = selectedAccount;

    if (account.networkType !== 'cardano') return;

    const { transaction } = transactionInfo;

    const signedTx = await TrezorConnect.cardanoSignTransaction({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        useEmptyPassphrase: device.useEmptyPassphrase,
        inputs: transaction.inputs,
        outputs: transaction.outputs,
        protocolMagic: getProtocolMagic(account.symbol),
        networkId: getNetworkId(account.symbol),
        fee: transactionInfo.fee,
    });

    if (!signedTx.success) {
        // catch manual error from ReviewTransaction modal
        if (signedTx.payload.error === 'tx-cancelled') return;
        dispatch(
            notificationActions.addToast({
                type: 'sign-tx-error',
                error: signedTx.payload.error,
            }),
        );
        return;
    }

    return signedTx.payload.serializedTx;
};
