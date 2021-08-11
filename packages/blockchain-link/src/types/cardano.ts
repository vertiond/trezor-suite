/* eslint-disable camelcase */
import { AccountInfoParams, EstimateFeeParams } from './params';
import { Responses } from '@blockfrost/blockfrost-js';

export interface Subscribe {
    subscribed: boolean;
}

export type Fee = {
    lovelacePerByte: number;
};

export interface Address {
    address: string;
    path: string;
    transfers: number;
    balance?: string;
    sent?: string;
    received?: string;
}

export interface AccountAddresses {
    change: Address[];
    used: Address[];
    unused: Address[];
}

export interface BlockfrostTransaction {
    address: string;
    txHash: string;
    txUtxos: Responses['tx_content_utxo'];
    txData: Responses['tx_content'];
    blockInfo: Responses['block_content'];
}

export interface BlockfrostAccountInfo {
    balance: string;
    addresses: AccountAddresses;
    empty: boolean;
    availableBalance: string;
    descriptor: string;
    tokens?: TokenBalance[];
    history: {
        total: number;
        tokens?: number;
        unconfirmed: number;
        transactions?: BlockfrostTransaction[];
    };
    page: {
        size: number;
        total: number;
        index: number;
    };
}

export interface AddressNotification {
    address: string;
    tx: any;
}

export interface ServerInfo {
    name: string;
    shortcut: string;
    testnet: boolean;
    version: string;
    decimals: number;
    blockHeight: number;
    blockHash: string;
}

export interface AccountUtxoParams {
    descriptor: string;
}

export type AccountUtxo = {
    txid: string;
    vout: number;
    value: string;
    height: number;
    address: string;
    path: string;
}[];

type UtxoContent = Responses['address_utxo_content'];

export interface UtxosData extends UtxoContent {
    blockInformation: Responses['block_content'];
}

export interface Balance {
    unit: string;
    quantity: string;
}

export interface TokenBalance extends Balance {
    decimals: number;
}

export interface Output {
    address: string;
    amount: Balance[];
}

export interface Input {
    address: string;
    amount: Balance[];
}

export interface BlockfrostUtxoData {
    tx_hash: string;
    tx_index: number;
    output_index: number;
    amount: {
        unit: string;
        quantity: string;
    }[];
    block: string;
}

export interface BlockfrostUtxos {
    address: string;
    path: string;
    utxoData: BlockfrostUtxoData;
    blockInfo: Responses['block_content'];
}

declare function FSend(method: 'GET_SERVER_INFO'): Promise<ServerInfo>;
declare function FSend(
    method: 'GET_BLOCK',
    params: { hashOrNumber: string | number }
): Promise<Responses['block_content']>;
declare function FSend(
    method: 'GET_ACCOUNT_INFO',
    params: AccountInfoParams
): Promise<BlockfrostAccountInfo>;
declare function FSend(
    method: 'GET_ACCOUNT_UTXO',
    params: AccountUtxoParams
): Promise<BlockfrostUtxos[]>;
declare function FSend(
    method: 'GET_TRANSACTION',
    params: { txId: string }
): Promise<BlockfrostTransaction>;
declare function FSend(method: 'PUSH_TRANSACTION', params: { transaction: string }): Promise<any>;
declare function FSend(method: 'SUBSCRIBE_BLOCK'): Promise<Subscribe>;
declare function FSend(method: 'UNSUBSCRIBE_BLOCK'): Promise<Subscribe>;
declare function FSend(
    method: 'SUBSCRIBE_ADDRESS',
    params: { addresses: string[] }
): Promise<Subscribe>;
declare function FSend(method: 'UNSUBSCRIBE_ADDRESS'): Promise<Subscribe>;
declare function FSend(method: 'ESTIMATE_FEE', params: EstimateFeeParams): Promise<Fee>;
export type Send = typeof FSend;
