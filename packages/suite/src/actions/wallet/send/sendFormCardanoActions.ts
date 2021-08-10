import TrezorConnect from 'trezor-connect';
import * as notificationActions from '@suite-actions/notificationActions';
import { FormState, UseSendFormState, PrecomposedTransactionFinal } from '@wallet-types/sendForm';
import { Dispatch, GetState } from '@suite-types';

export const composeTransaction = (formValues: FormState, formState: UseSendFormState) => async (
    dispatch: Dispatch,
) => {
    const { account, feeInfo } = formState;
    if (!account.addresses || !account.utxo) return;

    console.log('formValues', formValues);
    console.log('feeInfo', feeInfo);

    // serialization lib lib here
};

export const signTransaction = (
    formValues: FormState,
    transactionInfo: PrecomposedTransactionFinal,
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
        account: {
            addresses: account.addresses!,
        },
        coin: account.symbol,
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
