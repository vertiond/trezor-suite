import { BlockfrostUtxos, BlockfrostTransaction, BlockfrostAccountInfo } from '../../types/cardano';
import { Utxo } from '../../types/responses';
import BigNumber from 'bignumber.js';
import { Address } from '../../types';
import { VinVout } from '../../types/blockbook';
import { Transaction, AccountInfo, AccountAddresses, TokenInfo, Target } from '../../types/common';

export const transformUtxos = (utxos: BlockfrostUtxos[]): Utxo[] => {
    const result: Utxo[] = [];

    utxos.forEach(utxo => {
        const lovelaceBalance = utxo.utxoData.amount.find(b => b.unit === 'lovelace');
        if (!lovelaceBalance) return;

        result.push({
            address: utxo.address,
            txid: utxo.utxoData.tx_hash,
            confirmations: utxo.blockInfo.confirmations,
            blockHeight: utxo.blockInfo.height || 0,
            amount: lovelaceBalance?.quantity || '0',
            // blockbook only
            vout: -1,
            path: '-1',
        });
    });

    return result;
};

type Addresses = (Address | string)[] | string;

export const transformTokenInfo = (
    tokens: BlockfrostAccountInfo['tokens']
): TokenInfo[] | undefined => {
    if (!tokens || !Array.isArray(tokens)) return undefined;
    const info = tokens.reduce(
        (arr, t) =>
            arr.concat([
                {
                    type: 'CARDANO',
                    name: t.unit,
                    address: t.unit,
                    symbol: t.unit,
                    balance: t.quantity,
                    decimals: -1,
                },
            ]),
        [] as TokenInfo[]
    );
    return info.length > 0 ? info : undefined;
};

export const filterTargets = (addresses: Addresses, targets: VinVout[]): VinVout[] => {
    if (typeof addresses === 'string') {
        addresses = [addresses];
    }
    // neither addresses or targets are missing
    if (!addresses || !Array.isArray(addresses) || !targets || !Array.isArray(targets)) return [];

    const all: (string | null)[] = addresses.map(a => {
        if (typeof a === 'string') return a;
        if (typeof a === 'object' && typeof a.address === 'string') return a.address;
        return null;
    });

    return targets.filter(t => {
        if (t && Array.isArray(t.addresses)) {
            return t.addresses.filter(a => all.indexOf(a) >= 0).length > 0;
        }
        return false;
    });
};

export const transformInputOutput = (
    data: BlockfrostTransaction['txUtxos']['inputs'] | BlockfrostTransaction['txUtxos']['outputs']
): Target[] =>
    data.map((utxo, i) => ({
        n: i,
        addresses: [utxo.address],
        isAddress: true,
        amount: utxo.amount.find(a => a.unit === 'lovelace')?.quantity ?? '0',
    }));

const sumVinVout = (
    vinVout: VinVout[],
    initialValue = '0',
    operation: 'sum' | 'reduce' = 'sum'
) => {
    const sum = vinVout.reduce((bn, v) => {
        if (typeof v.value !== 'string') return bn;
        return operation === 'sum' ? bn.plus(v.value) : bn.minus(v.value);
    }, new BigNumber(initialValue));
    return sum.toString();
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

    return {
        type,
        txid: blockfrostTxData.txHash,
        blockTime: blockfrostTxData.blockInfo.time,
        blockHeight: blockfrostTxData.blockInfo.height || undefined,
        blockHash: blockfrostTxData.blockInfo.hash,
        amount,
        fee,
        totalSpent,
        targets,
        tokens: [],
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
            transactions: !cardanoTxs
                ? []
                : cardanoTxs.map(tx => transformTransaction(info.descriptor, info.addresses, tx)),
        },
    };

    // @ts-ignore
    return result;
};
