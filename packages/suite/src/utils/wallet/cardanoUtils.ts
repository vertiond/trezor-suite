import { CARDANO, CardanoCertificate, CardanoCertificateType } from 'trezor-connect';
import { types } from '@fivebinaries/coin-selection';
import { amountToSatoshi } from '@wallet-utils/accountUtils';
import { Account } from '@wallet-types';
import { Output } from '@wallet-types/sendForm';

export const getProtocolMagic = (accountSymbol: Account['symbol']) =>
    accountSymbol === 'ada' ? CARDANO.PROTOCOL_MAGICS.mainnet : 1097911063;

export const getNetworkId = (accountSymbol: Account['symbol']) =>
    accountSymbol === 'ada' ? CARDANO.NETWORK_IDS.mainnet : CARDANO.NETWORK_IDS.testnet;

export const getAddressType = (accountType: Account['accountType']): 0 | 8 =>
    accountType === 'normal' ? CARDANO.ADDRESS_TYPE.Base : CARDANO.ADDRESS_TYPE.Byron;

export const getStakingPath = (
    accountType: Account['accountType'],
    accountIndex: Account['index'],
) => `m/${accountType === 'normal' ? 1852 : 44}'/1815'/${accountIndex}'/2/0`;

export const getChangeAddressParameters = (account: Account) => {
    if (!account.addresses || account.networkType !== 'cardano') return;
    const stakingPath = getStakingPath(account.accountType, account.index);

    return {
        address: account.addresses.change[0].address,
        addressParameters: {
            path: account.addresses.change[0].path,
            addressType: getAddressType(account.accountType),
            stakingPath,
        },
    };
};

export const transformUserOutputs = (
    outputs: Output[],
    maxOutputIndex?: number,
): types.UserOutput[] =>
    outputs.map((output, i) => {
        const setMax = i === maxOutputIndex;
        const amount = output.amount === '' ? undefined : amountToSatoshi(output.amount, 6);
        return {
            address: output.address === '' ? undefined : output.address,
            amount: output.token ? undefined : amount,
            assets: output.token
                ? [
                      {
                          unit: output.token,
                          quantity: output.amount || '0',
                      },
                  ]
                : [],
            setMax,
        };
    });

export const transformUtxos = (utxos: Account['utxo']): types.Utxo[] => {
    const result: types.Utxo[] = [];
    utxos?.forEach(utxo => {
        const foundItem = result.find(
            res => res.txHash === utxo.txid && res.outputIndex === utxo.vout,
        );

        if (!foundItem) {
            // path: utxo.path,
            result.push({
                // path: utxo.path,
                address: utxo.address,
                txHash: utxo.txid,
                outputIndex: utxo.vout,
                amount: [{ quantity: utxo.amount, unit: utxo.cardanoUnit }],
            });
        } else {
            foundItem.amount.push({ quantity: utxo.amount, unit: utxo.cardanoUnit });
        }
    });

    return result;
};

export const prepareCertificates = (certs: CardanoCertificate[]) => {
    // convert trezor-connect certificate format to cardano coin-selection lib format
    const convertedCerts: types.Certificate[] = [];
    certs.forEach(cert => {
        switch (cert.type) {
            case CardanoCertificateType.STAKE_DELEGATION:
                convertedCerts.push({
                    type: cert.type,
                    pool: cert.pool!,
                });
                break;
            case CardanoCertificateType.STAKE_REGISTRATION:
            case CardanoCertificateType.STAKE_DEREGISTRATION:
                convertedCerts.push({
                    type: cert.type,
                });
                break;

            case CardanoCertificateType.STAKE_POOL_REGISTRATION:
                convertedCerts.push({
                    type: cert.type,
                    pool_parameters: cert.poolParameters!,
                });
                break;
            // no default
        }
    });
    return convertedCerts;
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
