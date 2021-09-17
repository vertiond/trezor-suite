import TrezorConnect, { CardanoTxSigningMode } from 'trezor-connect';
import {
    getChangeAddressParameters,
    getNetworkId,
    getProtocolMagic,
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
import { coinSelection, CoinSelectionError, trezorUtils } from '@fivebinaries/coin-selection';
import { formatNetworkAmount, isTestnet } from '@suite/utils/wallet/accountUtils';

export const composeTransaction =
    (formValues: FormState, formState: UseSendFormState) =>
    (dispatch: Dispatch): PrecomposedLevelsCardano | void => {
        const { account, feeInfo } = formState;
        const changeAddress = getChangeAddressParameters(account);
        if (!changeAddress || !account.utxo) return;

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
                const txPlan = coinSelection(
                    utxos,
                    outputs,
                    changeAddress.address,
                    [],
                    [],
                    account.descriptor,
                    options,
                );

                const tx = {
                    type: txPlan.type,
                    fee: txPlan.fee,
                    feePerByte: level.feePerUnit,
                    bytes: 0,
                    totalSpent: txPlan.totalSpent,
                    max:
                        txPlan.max && outputs.find(o => o.setMax && o.assets.length === 0)
                            ? formatNetworkAmount(txPlan.max, account.symbol)
                            : txPlan.max, // convert lovelace to ADA (for ADA outputs only)

                    transaction:
                        txPlan.type === 'final'
                            ? {
                                  inputs: trezorUtils.transformToTrezorInputs(
                                      txPlan.inputs,
                                      account.utxo!, // for some reason TS still considers 'undefined' as possible value
                                  ),
                                  outputs: trezorUtils.transformToTrezorOutputs(
                                      txPlan.outputs,
                                      changeAddress.addressParameters,
                                  ),
                                  unsignedTx: txPlan.tx,
                              }
                            : undefined,
                };
                wrappedResponse[level.label] = tx;
            } catch (error) {
                if (
                    error instanceof CoinSelectionError &&
                    error.code === 'UTXO_BALANCE_INSUFFICIENT'
                ) {
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

export const signTransaction =
    (formValues: FormState, transactionInfo: PrecomposedTransactionCardano) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const { selectedAccount } = getState().wallet;
        const { device } = getState().suite;

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

        const res = await TrezorConnect.cardanoSignTransaction({
            signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
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

        if (!res.success) {
            // catch manual error from ReviewTransaction modal
            if (res.payload.error === 'tx-cancelled') return;
            dispatch(
                notificationActions.addToast({
                    type: 'sign-tx-error',
                    error: res.payload.error,
                }),
            );
            return;
        }

        if (res.payload.hash !== transactionInfo.transaction.unsignedTx.hash) {
            dispatch(
                notificationActions.addToast({
                    type: 'sign-tx-error',
                    error: 'Error while building a transaction',
                }),
            );
            return;
        }

        const signedTx = trezorUtils.signTransaction(
            transactionInfo.transaction.unsignedTx.body,
            res.payload.witnesses,
            {
                testnet: isTestnet(account.symbol),
            },
        );
        console.log('serializedTx', signedTx);
        return signedTx;
    };
