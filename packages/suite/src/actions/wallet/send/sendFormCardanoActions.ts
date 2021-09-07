import TrezorConnect from 'trezor-connect';
import {
    findUtxo,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
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
import { formatNetworkAmount } from '@suite/utils/wallet/accountUtils';

export const composeTransaction = (formValues: FormState, formState: UseSendFormState) => (
    dispatch: Dispatch,
): PrecomposedLevelsCardano | void => {
    const { account, feeInfo } = formState;
    if (!account.addresses || !account.utxo) return;

    const stakingPath = getStakingPath(account.accountType, account.index);
    const changeAddress = {
        ...account.addresses.change[0],
        stakingPath,
    };

    const predefinedLevels = feeInfo.levels.filter(l => l.label !== 'custom');
    if (formValues.selectedFee === 'custom') {
        predefinedLevels.push({
            label: 'custom',
            feePerUnit: formValues.feePerUnit,
            blocks: -1,
        });
    }

    const utxos = transformUtxos(account.utxo);
    const outputs = transformUserOutputs(formValues.outputs, formValues.setMaxOutputId);

    const wrappedResponse: PrecomposedLevelsCardano = {};
    predefinedLevels.forEach(level => {
        const options = {
            byron: account.accountType !== 'normal',
            ...(level.label === 'custom' ? { feeParams: { a: formValues.feePerUnit } } : {}),
        };

        try {
            const res = coinSelection(utxos, outputs, changeAddress, [], [], options);

            const tx = {
                type: res.type,
                fee: res.fee,
                feePerByte: level.feePerUnit,
                bytes: 0,
                totalSpent: res.totalSpent,
                max:
                    res.max && outputs.find(o => o.setMax && o.assets.length === 0)
                        ? formatNetworkAmount(res.max, account.symbol)
                        : res.max, // convert lovelace to ADA (for ADA outputs only)

                transaction:
                    res.type === 'final'
                        ? {
                              inputs: res.inputs.map(input =>
                                  trezorUtils.transformToTrezorInput(
                                      input,
                                      findUtxo(account.utxo, input)!,
                                  ),
                              ),
                              outputs: res.outputs.map(o => trezorUtils.transformToTrezorOutput(o)),
                          }
                        : undefined,
            };
            wrappedResponse[level.label] = tx;
        } catch (error) {
            if (error.message === 'UTXO_BALANCE_INSUFFICIENT') {
                wrappedResponse[level.label] = {
                    type: 'error',
                    errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' },
                };
            } else {
                dispatch(
                    notificationActions.addToast({
                        type: 'sign-tx-error',
                        error: error.message,
                    }),
                );
            }
        }
    });

    return wrappedResponse;
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
