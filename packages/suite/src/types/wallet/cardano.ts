import { AccountUtxo } from 'trezor-connect';

export interface CardanoMergedUtxo extends Omit<AccountUtxo, 'amount'> {
    amount: {
        unit: string;
        quantity: string;
    }[];
}
