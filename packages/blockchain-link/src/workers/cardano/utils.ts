import { BlockfrostUtxos, BlockfrostTransaction } from '../../types/cardano';
import { Utxo } from '../../types/responses';
import BigNumber from 'bignumber.js';
import { Transaction } from '../../types/common';

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

export const transformTransaction = (
    descriptor: string,
    tx: BlockfrostTransaction
): Transaction => {
    if (tx.TransactionType !== 'Payment') {
        // TODO: https://github.com/ripple/ripple-lib/blob/develop/docs/index.md#transaction-types
        return {
            type: 'unknown',
            txid: tx.hash,
            amount: '0',
            fee: '0',
            totalSpent: '0',
            blockTime: tx.date,
            blockHeight: tx.ledger_index,
            blockHash: tx.hash,
            targets: [],
            tokens: [],
            details: {
                vin: [],
                vout: [],
                size: 0,
                totalInput: '0',
                totalOutput: '0',
            },
        };
    }
    const type = tx.Account === descriptor ? 'sent' : 'recv';
    const addresses = [tx.Destination];
    const amount = tx.Amount;
    const fee = tx.Fee;
    const amountBn = new BigNumber(amount);
    // TODO: proper types for tx would prevent this mess
    const totalSpent = amountBn.isNaN() ? '0' : amountBn.plus(tx.Fee ?? 0).toString();

    return {
        type,

        txid: tx.hash,
        blockTime: tx.date,
        blockHeight: tx.ledger_index,
        blockHash: tx.hash,

        amount,
        fee,
        totalSpent,
        targets: [
            {
                addresses,
                isAddress: true,
                amount,
                n: 0, // no multi-targets in ripple
            },
        ],
        tokens: [],
        details: {
            vin: [],
            vout: [],
            size: 0,
            totalInput: '0',
            totalOutput: '0',
        },
    };
};
