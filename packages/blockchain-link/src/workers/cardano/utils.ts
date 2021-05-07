import { BlockfrostUtxos } from '../../types/cardano';
import { Utxo } from '../../types/responses';

export const transformUtxos = (payload: BlockfrostUtxos): Utxo[] => {
    return payload.map(utxo => ({
        address: utxo.address,
        txid: utxo.data.tx_hash,
        blockHeight: utxo.data.block,
    }));
};
