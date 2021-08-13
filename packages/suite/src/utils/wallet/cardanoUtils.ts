import { Account, CardanoMergedUtxo } from '@wallet-types';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-browser';
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

export const transformUtxos = (utxos: Account['utxo']): CardanoMergedUtxo[] => {
    const result: CardanoMergedUtxo[] = [];
    utxos?.forEach(utxo => {
        const foundItem = result.find(res => res.txid === utxo.txid && res.vout === utxo.vout);

        if (!foundItem) {
            result.push({ ...utxo, amount: [{ quantity: utxo.amount, unit: utxo.cardanoUnit }] });
        } else {
            foundItem.amount.push({ quantity: utxo.amount, unit: utxo.cardanoUnit });
        }
    });

    return result;
};

export const parseAsset = (
    hex: string,
): {
    policyId: string;
    assetNameInHex: string;
} => {
    const policyIdSize = 56;
    const policyId = hex.slice(0, policyIdSize);
    const assetNameInHex = hex.slice(policyIdSize);
    return {
        policyId,
        assetNameInHex,
    };
};

export const buildMultiAsset = (
    multiAsset: CardanoWasm.MultiAsset,
    assets: {
        unit: string;
        quantity: string;
    }[],
): CardanoWasm.MultiAsset => {
    assets.forEach(assetEntry => {
        const asset = CardanoWasm.Assets.new();
        const { policyId, assetNameInHex } = parseAsset(assetEntry.unit);
        asset.insert(
            CardanoWasm.AssetName.new(Buffer.from(assetNameInHex, 'hex')),
            CardanoWasm.BigNum.from_str(assetEntry.quantity),
        );
        const scriptHash = CardanoWasm.ScriptHash.from_bytes(Buffer.from(policyId, 'hex'));
        multiAsset.insert(scriptHash, asset);
    });
    return multiAsset;
};

export const getMinAdaRequired = (
    multiAsset: CardanoWasm.MultiAsset | null,
    minUtxoValue = CardanoWasm.BigNum.from_str('1000000'),
): CardanoWasm.BigNum => {
    if (!multiAsset) return minUtxoValue;
    const Value = CardanoWasm.Value.new(minUtxoValue);
    Value.set_multiasset(multiAsset);
    return CardanoWasm.min_ada_required(Value, minUtxoValue);
};
