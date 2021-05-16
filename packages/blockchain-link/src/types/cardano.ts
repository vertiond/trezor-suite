/* eslint-disable camelcase */
import { AccountInfoParams } from './params';
import { Responses } from '@blockfrost/blockfrost-js';

export interface Subscribe {
    subscribed: boolean;
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

export type AccountInfo = any;
export type BlockfrostTransaction = any;

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

type UtxoContent = Responses['address_utxo_content'];

export interface UtxosData extends UtxoContent {
    blockInformation: Responses['block_content'];
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
    utxoData: BlockfrostUtxoData;
    blockInfo: Responses['block_content'];
}

declare function FSend(method: 'GET_SERVER_INFO'): Promise<ServerInfo>;
declare function FSend(
    method: 'GET_BLOCK',
    params: { hashOrNumber: string | number }
): Promise<Responses['block_content']>;
declare function FSend(method: 'GET_ACCOUNT_INFO', params: AccountInfoParams): Promise<AccountInfo>;
declare function FSend(
    method: 'GET_ACCOUNT_UTXO',
    params: AccountUtxoParams
): Promise<BlockfrostUtxos[]>;
declare function FSend(method: 'GET_TRANSACTION', params: { txId: string }): Promise<any>;
declare function FSend(method: 'PUSH_TRANSACTION', params: { hex: string }): Promise<any>;
declare function FSend(method: 'SUBSCRIBE_BLOCK'): Promise<any>;

export type Send = typeof FSend;
