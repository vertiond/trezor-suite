/* eslint-disable no-bitwise */
import TrezorConnect, {
    CardanoCertificate,
    CardanoCertificateType,
    CardanoWithdrawal,
} from 'trezor-connect';
import {
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
    prepareCertificates,
    transformUserOutputs,
    transformUtxos,
} from '@wallet-utils/cardanoUtils';
import * as notificationActions from '@suite-actions/notificationActions';
import {
    FormState,
    UseSendFormState,
    PrecomposedLevelsCardano,
    PrecomposedTransactionCardano,
} from '@wallet-types/sendForm';
import { Dispatch, GetState } from '@suite-types';
import { coinSelection, trezorUtils } from '@fivebinaries/coin-selection';

export const composeTransaction = (
    formValues: FormState,
    formState: UseSendFormState,
) => (): PrecomposedLevelsCardano | void => {
    const { account, feeInfo } = formState;
    if (!account.addresses || !account.utxo) return;
    const stakingPath = getStakingPath(account.accountType, account.index);

    const changeAddress = {
        ...account.addresses.change[0],
        stakingPath,
    };
    const utxos = transformUtxos(account.utxo);
    const outputs = transformUserOutputs(formValues.outputs);

    console.log('=======COMPOSE=======');
    console.log(
        'account utxos',
        utxos.map(u => ({ ...u })),
    );

    // try {
    const res = coinSelection(
        utxos,
        outputs,
        changeAddress,
        [],
        [],
        false,
        account.accountType !== 'normal',
    );
    console.log('tx fee', res.fee);
    console.log('tx totalSpent', res.totalSpent);
    console.log('tx inputs', res.inputs);
    console.log('tx outputs', res.outputs);
    console.log('withdrawal', res.withdrawal);
    console.log('deposit', res.deposit);
    return {
        normal: {
            type: 'final',
            fee: res.fee,
            feePerByte: feeInfo.levels[0].feePerUnit,
            bytes: 300,
            totalSpent: res.totalSpent,
            max: undefined,
            transaction: {
                inputs: res.inputs.map(i =>
                    trezorUtils.transformToTrezorInput(
                        i,
                        account.utxo!.find(u => u.txid === i.txHash && u.vout === i.outputIndex)!
                            .path,
                    ),
                ),
                outputs: res.outputs.map(o => trezorUtils.transformToTrezorOutput(o)),
            },
        },
    };
    // } catch (err) {
    //     console.warn('logged error');
    //     console.error(err);
    // }
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
