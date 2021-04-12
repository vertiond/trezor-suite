import { BlockfrostUtxos, BlockfrostTransaction, BlockfrostAccountInfo } from '../../types/cardano';
import { Utxo } from '../../types/responses';
import BigNumber from 'bignumber.js';
import { Transaction, AccountInfo, AccountAddresses } from '../../types/common';

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

const getTxType = (
    blockfrostTxData: BlockfrostTransaction,
    accountAddress?: AccountAddresses
): 'self' | 'recv' | 'sent' => {
    return 'self';
};

export const transformTransaction = (
    descriptor: string,
    accountAddress: AccountAddresses | undefined,
    blockfrostTxData: BlockfrostTransaction
): Transaction => {
    const lovelaceBalance = blockfrostTxData.txData.output_amount.find(b => b.unit === 'lovelace');
    const fee = blockfrostTxData.txData.fees;
    const totalSpent = new BigNumber(lovelaceBalance?.quantity || '0').plus(fee).toString();

    return {
        type: getTxType(blockfrostTxData, accountAddress),
        txid: blockfrostTxData.txHash,
        blockTime: blockfrostTxData.blockInfo.time,
        blockHeight: blockfrostTxData.blockInfo.height || undefined,
        blockHash: blockfrostTxData.blockInfo.hash,
        amount: lovelaceBalance?.quantity || '0',
        fee,
        totalSpent,
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
};

export const transformAccountInfo = (info: BlockfrostAccountInfo): AccountInfo => {
    const cardanoTxs = info.history.transactions;

    const result = {
        ...info,
        tokens: [],
        history: {
            transactions: !cardanoTxs
                ? []
                : cardanoTxs.map((tx: any) =>
                      // @ts-ignore
                      transformTransaction(info.descriptor, info.addresses, tx)
                  ),
        },
    };

    // @ts-ignore
    return result;
};
