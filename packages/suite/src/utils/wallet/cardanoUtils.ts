import { Account } from '@wallet-types';
import { CARDANO } from 'trezor-connect';

export const getStakingPath = (
    accountType: Account['accountType'],
    accountIndex: Account['index'],
) => `m/${accountType === 'normal' ? 1852 : 44}'/1815'/${accountIndex}'/2/0.`;

export const getProtocolMagic = (accountSymbol: Account['symbol']) =>
    accountSymbol === 'ada' ? CARDANO.PROTOCOL_MAGICS.mainnet : 1097911063;

export const getNetworkId = (accountSymbol: Account['symbol']) =>
    accountSymbol === 'ada' ? CARDANO.NETWORK_IDS.mainnet : CARDANO.NETWORK_IDS.testnet;

export const getAddressType = (accountType: Account['accountType']): 0 | 8 =>
    accountType === 'normal' ? CARDANO.ADDRESS_TYPE.Base : CARDANO.ADDRESS_TYPE.Byron;

export const transformUtxos = (utxos: Account['utxos']) => {
    const result = [];

    utxos.forEach(utxo => {
        const foundItem = result.find(res => res.txid === utxo.txid);

        if (!foundItem) {
            result.push({ ...utxo, amount: [{ quantity: utxo.amount, unit: utxo.cardanoUnit }] });
        } else {
            foundItem.amount.push({ quantity: utxo.amount, unit: utxo.cardanoUnit });
        }
    });

    return result;
};
