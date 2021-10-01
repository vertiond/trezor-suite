import BigNumber from 'bignumber.js';
import EmurgoCip from '@emurgo/cip14-js';
import { BlockfrostUtxos, BlockfrostTransaction, BlockfrostAccountInfo } from '../../types/cardano';
import { Utxo } from '../../types/responses';
import { VinVout } from '../../types/blockbook';
import {
    Transaction,
    AccountInfo,
    AccountAddresses,
    TokenInfo,
    TokenTransfer,
} from '../../types/common';
import { filterTargets, sumVinVout, transformTarget } from '../utils';

export const hexToString = (input: string) => {
    const hex = input.toString();
    let str = '';
    for (let n = 0; n < hex.length; n += 2) {
        str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }

    return str;
};

export const getFingerprint = (policyId: string, assetName?: string): string =>
    new EmurgoCip(
        Uint8Array.from(Buffer.from(policyId, 'hex')),
        Uint8Array.from(Buffer.from(assetName || '', 'hex'))
    ).fingerprint();

export const parseAsset = (hex: string) => {
    const policyIdSize = 56;
    const policyId = hex.slice(0, policyIdSize);
    const assetNameInHex = hex.slice(policyIdSize);
    const assetName = hexToString(assetNameInHex);
    const fingerprint = getFingerprint(policyId, assetNameInHex);
    return {
        policyId,
        assetName,
        fingerprint,
    };
};

export const transformUtxos = (utxos: BlockfrostUtxos[]): Utxo[] => {
    const result: Utxo[] = [];

    utxos.forEach(utxo =>
        utxo.utxoData.amount.forEach(u => {
            result.push({
                address: utxo.address,
                txid: utxo.utxoData.tx_hash,
                confirmations: utxo.blockInfo.confirmations,
                blockHeight: utxo.blockInfo.height || 0,
                amount: u.quantity,
                vout: utxo.utxoData.output_index,
                path: utxo.path,
                cardanoUnit: u.unit,
            });
        })
    );

    return result;
};

export const transformTokenInfo = (
    tokens: BlockfrostAccountInfo['tokens']
): TokenInfo[] | undefined => {
    if (!tokens || !Array.isArray(tokens)) return undefined;
    const info = tokens.map(t => {
        const { fingerprint, assetName } = parseAsset(t.unit);
        return {
            type: 'CARDANO',
            name: fingerprint,
            address: t.unit,
            symbol: assetName || fingerprint, // fallback to fingerprint if assetName is empty string
            balance: t.quantity,
            decimals: t.decimals,
        };
    });

    return info.length > 0 ? info : undefined;
};

export const transformInputOutput = (
    data: BlockfrostTransaction['txUtxos']['inputs'] | BlockfrostTransaction['txUtxos']['outputs'],
    asset = 'lovelace'
): VinVout[] =>
    data.map((utxo, i) => ({
        n: i,
        addresses: [utxo.address],
        isAddress: true,
        value: utxo.amount.find(a => a.unit === asset)?.quantity ?? '0',
    }));

export const filterTokenTransfers = (
    accountAddress: AccountAddresses,
    tx: BlockfrostTransaction,
    type: Transaction['type']
): TokenTransfer[] => {
    const transfers: TokenTransfer[] = [];
    const myNonChangeAddresses = accountAddress.used.concat(accountAddress.unused);
    const myAddresses = accountAddress.change.concat(myNonChangeAddresses);
    tx.txUtxos.outputs.forEach(output => {
        output.amount
            .filter(a => a.unit !== 'lovelace')
            .forEach(asset => {
                const token = asset.unit;
                const inputs = transformInputOutput(tx.txUtxos.inputs, token);
                const outputs = transformInputOutput(tx.txUtxos.outputs, token);
                const outgoing = filterTargets(myAddresses, inputs); // inputs going from account address
                const incoming = filterTargets(myAddresses, outputs); // outputs to account address
                const isChange = accountAddress.change.find(a => a.address === output.address);

                if (incoming.length === 0 && outgoing.length === 0) return null;

                const incomingForOutput = filterTargets(
                    myNonChangeAddresses,
                    transformInputOutput([output], token)
                );

                let amount = '0';
                if (type === 'sent') {
                    amount = isChange ? '0' : asset.quantity;
                } else if (type === 'recv') {
                    amount = sumVinVout(incomingForOutput, '0');
                } else if (type === 'self' && !isChange) {
                    amount = sumVinVout(incomingForOutput, '0');
                }

                if (amount === '0') return null;

                const { fingerprint, assetName } = parseAsset(token);
                transfers.push({
                    type,
                    name: fingerprint,
                    symbol: assetName || fingerprint,
                    address: token,
                    decimals: 0,
                    amount: amount.toString(),
                    from:
                        type === 'sent' || type === 'self'
                            ? tx.address
                            : tx.txUtxos.inputs.find(i => i.amount.find(a => a.unit === token))
                                  ?.address,
                    to: type === 'recv' ? tx.address : output.address,
                });
            });
    });

    return transfers.filter(t => !!t) as TokenTransfer[];
};

export const transformTransaction = (
    descriptor: string,
    accountAddress: AccountAddresses | undefined,
    blockfrostTxData: BlockfrostTransaction
): Transaction => {
    const myAddresses = accountAddress
        ? accountAddress.change.concat(accountAddress.used, accountAddress.unused)
        : [descriptor];

    let type: Transaction['type'];
    let targets: VinVout[] = [];
    let amount =
        blockfrostTxData.txData.output_amount.find(b => b.unit === 'lovelace')?.quantity || '0';
    const fee = blockfrostTxData.txData.fees;
    let totalSpent = new BigNumber(amount || '0').plus(fee).toString();
    const inputs = transformInputOutput(blockfrostTxData.txUtxos.inputs);
    const outputs = transformInputOutput(blockfrostTxData.txUtxos.outputs);
    const vinLength = Array.isArray(inputs) ? inputs.length : 0;
    const voutLength = Array.isArray(outputs) ? outputs.length : 0;
    const outgoing = filterTargets(myAddresses, inputs);
    const incoming = filterTargets(myAddresses, outputs);
    const internal = accountAddress ? filterTargets(accountAddress.change, outputs) : [];
    const totalInput = sumVinVout(vinLength ? inputs : []);
    const totalOutput = sumVinVout(voutLength ? outputs : []);

    if (outgoing.length === 0 && incoming.length === 0) {
        type = 'unknown';
    } else if (
        vinLength > 0 &&
        voutLength > 0 &&
        outgoing.length === vinLength &&
        incoming.length === voutLength
    ) {
        // all inputs and outputs are mine
        type = 'self';
        targets = outputs.filter(o => internal.indexOf(o) < 0);
        // recalculate amount, amount spent is just a fee
        amount = blockfrostTxData.txData.fees;
        totalSpent = amount;
    } else if (outgoing.length === 0 && incoming.length > 0) {
        // none of the input is mine but and output or token transfer is mine
        type = 'recv';
        amount = '0';
        if (incoming.length > 0) {
            targets = incoming;
            // recalculate amount, sum all incoming vout
            amount = sumVinVout(incoming, amount);
            totalSpent = amount;
        }
    } else {
        type = 'sent';
        targets = outputs.filter(o => internal.indexOf(o) < 0);
        // regular targets
        if (voutLength) {
            // bitcoin-like transaction
            // sum all my inputs
            const myInputsSum = sumVinVout(outgoing, '0');
            // reduce sum by my outputs values
            totalSpent = sumVinVout(incoming, myInputsSum, 'reduce');
            amount = new BigNumber(totalSpent).minus(fee ?? '0').toString();
        }
    }

    const tokens = accountAddress
        ? filterTokenTransfers(accountAddress, blockfrostTxData, type)
        : [];

    return {
        type,
        txid: blockfrostTxData.txHash,
        blockTime: blockfrostTxData.blockInfo.time,
        blockHeight: blockfrostTxData.blockInfo.height || undefined,
        blockHash: blockfrostTxData.blockInfo.hash,
        amount,
        fee,
        totalSpent,
        targets: targets.filter(t => typeof t === 'object').map(t => transformTarget(t, incoming)),
        tokens,
        details: {
            vin: inputs,
            vout: outputs,
            size: blockfrostTxData.txData.size,
            totalInput: totalInput ? totalInput.toString() : '0',
            totalOutput: totalOutput ? totalOutput.toString() : '0',
        },
    };
};

export const transformAccountInfo = (info: BlockfrostAccountInfo): AccountInfo => {
    const cardanoTxs = info.history.transactions;

    const result = {
        ...info,
        tokens: transformTokenInfo(info.tokens),
        history: {
            ...info.history,
            transactions: !cardanoTxs
                ? []
                : cardanoTxs?.map(tx => transformTransaction(info.descriptor, info.addresses, tx)),
        },
    };

    return result;
};