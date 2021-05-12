import { BlockfrostUtxos } from '../../types/cardano';
import { Utxo } from '../../types/responses';

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
            vout: -1, // bitcoin only
            path: '-1',
        });
    });

    return result;
};
