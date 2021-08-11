import TrezorConnect from 'trezor-connect';
import { getNetworkId, getProtocolMagic } from '@wallet-utils/cardanoUtils';
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
        (acc, currentValues) => acc.plus(networkAmountToSatoshi(currentValues.amount, 'ada')),
        new BigNumber('0'),
    );

    const totalOutputWithFee = totalOutputAmount.plus(fee);
    let totalUsedUtxoAmount = new BigNumber(0);

    sortedUtxos.forEach(utxo => {
        if (totalUsedUtxoAmount.isLessThanOrEqualTo(totalOutputWithFee)) {
            totalUsedUtxoAmount = totalUsedUtxoAmount.plus(
                networkAmountToSatoshi(utxo.amount, 'ada'),
            );
            resultUtxo.push(utxo);
        }
    });

    return {
        normal: {
            type: 'final',
            fee,
            feePerByte: '0.44',
            bytes: 1,
            totalSpent: totalOutputWithFee.toString(),
            max: undefined,
            transaction: {
                inputs: resultUtxo.map(utxo => ({
                    address: utxo.address,
                    path: utxo.path,
                    amount: utxo.amount,
                    prev_hash: utxo.txid,
                    prev_index: utxo.vout,
                })),
                outputs: formValues.outputs.map(o => ({
                    address: o.address,
                    amount: o.amount,
                    token_bundle: [],
                })),
                outputsPermutation: [0],
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

    // export interface CardanoInput {
    //     path: string | number[];
    //     prev_hash: string;
    //     prev_index: number;
    // }

    // export type CardanoToken = {
    //     assetNameBytes: string;
    //     amount: string;
    // }

    // export type CardanoAssetGroup = {
    //     policyId: string;
    //     tokenAmounts: CardanoToken[];
    // }

    // export type CardanoOutput =
    //     | {
    //           addressParameters: CardanoAddressParameters;
    //           amount: string;
    //           tokenBundle?: CardanoAssetGroup[];
    //       }
    //     | {
    //           address: string;
    //           amount: string;
    //           tokenBundle?: CardanoAssetGroup[];
    //       }

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
