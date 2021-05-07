import { AccountInfoParams } from './params';
import { Responses } from '@blockfrost/blockfrost-js';

export interface Subscribe {
    subscribed: boolean;
}

export type BlockfrostUtxos = {
    address: string;
    data: Responses['address_utxo_content'];
}[];

export interface ServerInfo {
    url: string;
    name: string;
    shortcut: string;
    testnet: boolean;
    version: string;
    decimals: number;
    blockHeight: number;
    blockHash: string;
}

export type AccountInfo = any;

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
    confirmations: number;
    coinbase?: boolean;
}[];

export type Transaction = any;

declare function FSend(method: 'GET_SERVER_INFO'): Promise<ServerInfo>;
declare function FSend(method: 'GET_ACCOUNT_INFO', params: AccountInfoParams): Promise<AccountInfo>;
declare function FSend(method: 'GET_ACCOUNT_UTXO', params: AccountUtxoParams): Promise<AccountUtxo>;
declare function FSend(method: 'GET_TRANSACTION', params: { txId: string }): Promise<Transaction>;
declare function FSend(method: 'PUSH_TRANSACTION', params: { hex: string }): Promise<any>;
declare function FSend(method: 'SUBSCRIBE_BLOCK'): Promise<any>;

export type Send = typeof FSend;
