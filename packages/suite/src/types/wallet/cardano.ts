import { AccountUtxo } from 'trezor-connect';

export interface CardanoMergedUtxo extends Omit<AccountUtxo, 'amount'> {
    amount: {
        unit: string;
        quantity: string;
    }[];
}

export type DerivationType =
    | { value: 'icarus'; label: 'Icarus' }
    | { value: 'icarus-trezor'; label: 'Icarus Trezor' };
