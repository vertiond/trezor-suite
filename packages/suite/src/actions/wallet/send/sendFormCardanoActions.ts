/* eslint-disable no-bitwise */
import TrezorConnect, { CardanoInput, CardanoOutput } from 'trezor-connect';
import {
    buildMultiAsset,
    getAddressType,
    getMinAdaRequired,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
    parseAsset,
    transformUtxos,
} from '@wallet-utils/cardanoUtils';
import { Account, CardanoMergedUtxo } from '@wallet-types';
import { amountToSatoshi } from '@wallet-utils/accountUtils';
import * as notificationActions from '@suite-actions/notificationActions';
import {
    FormState,
    UseSendFormState,
    PrecomposedLevelsCardano,
    PrecomposedTransactionCardano,
    Output,
} from '@wallet-types/sendForm';
import { Dispatch, GetState } from '@suite-types';
import BigNumber from 'bignumber.js';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-browser';

const protocolMinUtxoValue = CardanoWasm.BigNum.from_str('1000000');
const txBuilder = CardanoWasm.TransactionBuilder.new(
    CardanoWasm.LinearFee.new(
        CardanoWasm.BigNum.from_str('44'),
        CardanoWasm.BigNum.from_str('155381'),
    ),
    protocolMinUtxoValue,
    // pool deposit
    CardanoWasm.BigNum.from_str('500000000'),
    // key deposit
    CardanoWasm.BigNum.from_str('2000000'),
);

const getAssetAmount = (utxo: CardanoMergedUtxo, asset = 'lovelace') =>
    utxo.amount.find(a => a.unit === asset)?.quantity ?? '0';

const getSumAssetAmount = (utxos: CardanoMergedUtxo[], asset = 'lovelace') =>
    utxos.reduce(
        (acc, utxo) => acc.checked_add(CardanoWasm.BigNum.from_str(getAssetAmount(utxo, asset))),
        CardanoWasm.BigNum.from_str('0'),
    );
const sortUtxos = (utxos: CardanoMergedUtxo[], asset = 'lovelace') =>
    utxos.sort((u1, u2) =>
        new BigNumber(getAssetAmount(u2, asset)).comparedTo(getAssetAmount(u1, asset)),
    );

const transformToTokenBundle = (assets: { unit: string; quantity: string }[]) => {
    // prepare token bundle used in trezor output
    const uniquePolicies: string[] = [];
    assets.forEach(asset => {
        const { policyId } = parseAsset(asset.unit);
        if (!uniquePolicies.includes(policyId)) {
            uniquePolicies.push(policyId);
        }
    });

    return uniquePolicies.map(policyId => ({
        policyId,
        tokenAmounts: assets
            .filter(asset => {
                const assetInfo = parseAsset(asset.unit);
                return assetInfo.policyId === policyId;
            })
            .map(asset => {
                const assetInfo = parseAsset(asset.unit);

                return {
                    assetNameBytes: assetInfo.assetNameInHex,
                    amount: asset.quantity,
                };
            }),
    }));
};

const transformToCardanoInput = (utxo: CardanoMergedUtxo): CardanoInput => ({
    path: utxo.path,
    prev_hash: utxo.txid,
    prev_index: utxo.vout,
});
const transformToCardanoOutput = (output: Output): CardanoOutput => ({
    address: output.address,
    amount: amountToSatoshi(output.amount, 6),
    // TODO: To send tokens we need to add tokenBundle and set amount above to minUtxoValue which (can be retrieved from getOutputCost)
    // tokenBundle: output.token
    //     ? transformToTokenBundle([{ unit: output.token, quantity: output.amount }])
    //     : undefined,
});

const getInputCost = (utxo: CardanoMergedUtxo) => {
    // Calculate additional fee required to add utxo to a transaction
    const input = CardanoWasm.TransactionInput.new(
        CardanoWasm.TransactionHash.from_bytes(Buffer.from(utxo.txid, 'hex')),
        utxo.vout,
    );

    const inputValue = CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(getAssetAmount(utxo)));
    const assets = utxo.amount.filter(a => a.unit !== 'lovelace');
    if (assets) {
        const multiAsset = CardanoWasm.MultiAsset.new();
        buildMultiAsset(multiAsset, assets);
        inputValue.set_multiasset(multiAsset);
    }

    const utxoAddr = CardanoWasm.Address.from_bech32(utxo.address);
    const inputFee = txBuilder.fee_for_input(utxoAddr, input, inputValue); // does utxoAddr makes sense here?
    return {
        input: utxo,
        inputFee,
    };
};

const getOutputCost = (
    output: Pick<Output, 'amount' | 'token' | 'address'>,
    assets: { unit: string; quantity: string }[] | null,
    minUtxoValue = protocolMinUtxoValue,
) => {
    let minOutputAmount = minUtxoValue;
    let outputValue = CardanoWasm.Value.new(minOutputAmount);

    if (output.token || assets?.length) {
        const multiAsset = CardanoWasm.MultiAsset.new();
        buildMultiAsset(
            multiAsset,
            assets ?? [
                {
                    unit: output.token!,
                    quantity: output.amount,
                },
            ],
        );

        minOutputAmount = getMinAdaRequired(multiAsset, minUtxoValue);
        outputValue = CardanoWasm.Value.new(minOutputAmount);
        outputValue.set_multiasset(multiAsset);
    } else {
        // ADA only output
        minOutputAmount = protocolMinUtxoValue;
    }
    const outputAddr = CardanoWasm.Address.from_bech32(output.address); // TODO: compatibility with byron
    const testOutput = CardanoWasm.TransactionOutput.new(outputAddr, outputValue);
    const outputFee = txBuilder.fee_for_output(testOutput);
    return {
        output,
        outputFee,
        minOutputAmount, // should match https://cardano-ledger.readthedocs.io/en/latest/explanations/min-utxo.html
    };
};

const ERROR_UTXO_BALANCE_INSUFFICIENT = 'UTxO Balance Insufficient';

const largestFirst = (
    utxos: CardanoMergedUtxo[],
    formOutputs: Output[],
    changeAddress: Exclude<Account['addresses'], undefined>['change'][number],
    account: Account,
) => {
    if (utxos.length === 0) {
        throw Error(ERROR_UTXO_BALANCE_INSUFFICIENT);
    }

    const usedUtxos: CardanoMergedUtxo[] = [];
    let totalFeesAmount = txBuilder.min_fee();
    let utxosTotalAmount = CardanoWasm.BigNum.from_str('0');
    const sortedUtxos = sortUtxos(utxos);

    const requiredOutputs = formOutputs.map(output => ({
        ...output,
        // tokenAmount: output.token ? output.amount : undefined,
    }));
    // Sum of all form outputs, ADA only for now
    const totalOutputAmount = requiredOutputs.reduce(
        (acc, output) =>
            acc.checked_add(CardanoWasm.BigNum.from_str(amountToSatoshi(output.amount, 6))),
        CardanoWasm.BigNum.from_str('0'),
    );

    console.log('requiredOutputs', requiredOutputs);

    // Calculate fee and minUtxoValue for all external outputs
    const outputsCost = requiredOutputs.map(output => getOutputCost(output, null));

    const totalOutputsFee = outputsCost.reduce(
        (acc, output) => (acc = acc.checked_add(output.outputFee)),
        CardanoWasm.BigNum.from_str('0'),
    );

    // add external outputs fees to total
    totalFeesAmount = totalFeesAmount.checked_add(totalOutputsFee);
    let changeOutput;
    let sufficientUtxos = false;
    const selectUtxos = () => {
        while (sortedUtxos.length) {
            const utxo = sortedUtxos.shift();
            if (!utxo) break;

            usedUtxos.push(utxo);

            const { inputFee } = getInputCost(utxo);

            // txBuilder.add_input(utxo.address, input, inputValue);
            // add input fee to total
            totalFeesAmount = totalFeesAmount.checked_add(inputFee);

            utxosTotalAmount = utxosTotalAmount.checked_add(
                CardanoWasm.BigNum.from_str(getAssetAmount(utxo)),
            );

            // Calculate change output

            // change output amount should be lowered by the cost of the change output (fee + min utxoval)
            // The cost will be subtracted once we calculate it.
            const placeholderChangeOutputAmount = utxosTotalAmount.clamped_sub(
                totalFeesAmount.checked_add(totalOutputAmount),
            );
            const uniqueAssets: string[] = [];
            usedUtxos.forEach(utxo => {
                const assets = utxo.amount.filter(a => a.unit !== 'lovelace');
                assets.forEach(asset => {
                    if (!uniqueAssets.includes(asset.unit)) {
                        uniqueAssets.push(asset.unit);
                    }
                });
            });

            const changeOutputAssets = uniqueAssets
                .map(assetUnit => {
                    const assetInputAmount = getSumAssetAmount(usedUtxos, assetUnit);
                    const assetSpentAmount = requiredOutputs.reduce(
                        (acc, output) =>
                            (acc =
                                output.token === assetUnit
                                    ? acc.checked_add(CardanoWasm.BigNum.from_str(output.amount))
                                    : acc),
                        CardanoWasm.BigNum.from_str('0'),
                    );
                    return {
                        unit: assetUnit,
                        quantity: assetInputAmount.clamped_sub(assetSpentAmount).to_str(),
                    };
                })
                .filter(asset => asset.quantity !== '0');

            const changeOutputCost = getOutputCost(
                {
                    address: changeAddress.address,
                    amount: placeholderChangeOutputAmount.to_str(),
                    token: null,
                },
                changeOutputAssets,
            );

            const totalSpent = totalOutputAmount
                .checked_add(totalFeesAmount)
                .checked_add(changeOutputCost.outputFee);
            let changeOutputAmount = utxosTotalAmount.clamped_sub(totalSpent);

            console.log('totalSpent', totalSpent.to_str());
            console.log('changeOutputAmount', changeOutputAmount.to_str());
            console.log(
                'changeOutputCost.minOutputAmount',
                changeOutputCost.minOutputAmount.to_str(),
            );
            // Sum of all tokens in utxos must be same as sum of the tokens in external + change outputs
            // If computed change output doesn't contain any tokens then it makes sense to add it only if the fee + minUtxoValue is less then the amount
            const isChangeOutputNeeded =
                changeOutputAssets.length > 0 ||
                changeOutputAmount.compare(changeOutputCost.minOutputAmount) > 0;

            let requiredAmount = totalFeesAmount.checked_add(totalOutputAmount); // fees + regulars outputs
            let addAnotherUtxo = false;
            if (isChangeOutputNeeded) {
                if (changeOutputAmount.compare(changeOutputCost.minOutputAmount) < 0) {
                    // computed change amount would be below minUtxoValue
                    // but since we need to return assets let's try to add another utxo
                    changeOutputAmount = changeOutputCost.minOutputAmount;
                    addAnotherUtxo = true; // flag probably not necessary anymore
                    if (!utxos.length) {
                        console.warn(
                            'malo utxa na vytvorenie change outputu, ale change output je potrebny kvoli vrateniu tokenov.. fail',
                        );
                    }
                }
                // adding change output grows the required amount
                requiredAmount = requiredAmount
                    .checked_add(changeOutputAmount)
                    .checked_add(changeOutputCost.outputFee);
            }

            console.log('----');
            console.log('utxosTotalAmount', utxosTotalAmount.to_str());
            console.log('requiredAmount', requiredAmount.to_str());
            console.log('addAnotherUtxo', addAnotherUtxo);
            if (utxosTotalAmount.compare(requiredAmount) >= 0 && !addAnotherUtxo) {
                // we have enough utxos to cover fees + minUtxoValue for each output
                // TODO: we should check if we have enough utxos for each asset

                if (isChangeOutputNeeded) {
                    totalFeesAmount = totalFeesAmount.checked_add(changeOutputCost.outputFee);
                    // prepare trezor change output
                    changeOutput = {
                        amount: changeOutputAmount.to_str(),
                        addressParameters: {
                            path: changeAddress.path,
                            addressType: getAddressType(account.accountType),
                            stakingPath: getStakingPath(account.accountType, account.index),
                        },
                        tokenBundle: transformToTokenBundle(changeOutputAssets),
                    };
                } else {
                    console.warn(
                        `Change output would be inefficient. Burning ${placeholderChangeOutputAmount} as fee`,
                    );
                    totalFeesAmount = totalFeesAmount.checked_add(placeholderChangeOutputAmount);
                }
                sufficientUtxos = true;
                break;
            }
        }
    };

    selectUtxos();

    if (!sufficientUtxos) {
        throw Error(ERROR_UTXO_BALANCE_INSUFFICIENT);
    }

    const inputs = usedUtxos.map(utxo => transformToCardanoInput(utxo));
    const outputs: CardanoOutput[] = requiredOutputs.map(o => transformToCardanoOutput(o));
    if (changeOutput) {
        outputs.push(changeOutput);
    }

    const totalSpent = totalOutputAmount.checked_add(totalFeesAmount);
    console.log('usedUtxos', usedUtxos);
    console.log('totalOutputAmount', totalOutputAmount.to_str());
    console.log('utxosTotalAmount', utxosTotalAmount.to_str());
    console.log('totalSpent', totalSpent.to_str());
    return {
        inputs,
        outputs,
        fee: totalFeesAmount,
        totalSpent,
    };
};

export const composeTransaction = (
    formValues: FormState,
    formState: UseSendFormState,
) => (): PrecomposedLevelsCardano | void => {
    const { account, feeInfo } = formState;
    if (!account.addresses || !account.utxo) return;

    const changeAddress = account.addresses.change[0];
    const utxos = transformUtxos(account.utxo);

    console.log('=======COMPOSE=======');
    console.log(
        'account utxos',
        utxos.map(u => ({ ...u })),
    );

    // try {
    const res = largestFirst(utxos, formValues.outputs, changeAddress, account);
    console.log('tx fee', res.fee.to_str());
    console.log('tx totalSpent', res.totalSpent.to_str());
    console.log('tx inputs', res.inputs);
    console.log('tx outputs', res.outputs);
    return {
        normal: {
            type: 'final',
            fee: res.fee.to_str(),
            feePerByte: '0.44',
            bytes: 300,
            totalSpent: res.totalSpent.to_str(),
            max: undefined,
            transaction: {
                inputs: res.inputs,
                outputs: res.outputs,
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
