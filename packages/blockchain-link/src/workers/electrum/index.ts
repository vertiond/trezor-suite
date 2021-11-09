import { CustomError } from '../../constants/errors';
import { MESSAGES, RESPONSES } from '../../constants';
import type { Message, Response } from '../../types';
import * as M from './methods';
import * as L from './listeners';
import WorkerCommon from '../common';
import { ElectrumClient } from './client/electrum';
import { CachingElectrumClient } from './client/caching';
import { getContext } from '../context';
import { ProxySocket } from './sockets/proxy';

const { ctx, common, state, BlockchainLinkModule: ElectrumModule } = getContext({});

const electrumClient = new CachingElectrumClient();
const blockListener = L.blockListener(electrumClient, common);
const txListener = L.txListener(electrumClient, common);

const chooseServer = (server: string[]): string => {
    if (!server || !Array.isArray(server) || server.length < 1) {
        throw new CustomError('connect', 'Endpoint not set');
    }
    return server[0];
};

const connect = async () => {
    if (!electrumClient.connected()) {
        const { server, debug, timeout, keepAlive } = common.getSettings();
        const url = chooseServer(server);
        const socket = new ProxySocket(url, { timeout, keepAlive });
        await electrumClient.connect(socket, {
            url,
            debug,
            client: {
                name: 'blockchain-link',
                protocolVersion: '1.4',
            },
        });
        common.response({
            id: -1,
            type: RESPONSES.CONNECTED,
        });
    }
    return electrumClient;
};

const disconnect = ({ id }: { id: number }) => {
    if (electrumClient.connected()) {
        electrumClient.close();
    }
    common.response({ id, type: RESPONSES.DISCONNECTED, payload: true });
};

const cleanup = () => {}; // TODO

const call = <M extends Message & { payload: any }, R extends Response>(
    method: (
        client: ElectrumClient,
        payload: M['payload'],
        common: WorkerCommon
    ) => Promise<R['payload']>,
    data: M,
    type: R['type']
) =>
    connect()
        .then(client => method(client, data.payload, common))
        .then(res => common.response({ id: data.id, type, payload: res }))
        .catch(error => common.errorHandler({ id: data.id, error }));

// WebWorker message handling
ctx.onmessage = (event: { data: Message }) => {
    if (!event.data) return;
    const { data } = event;
    const { id, type } = data;

    common.debug('onmessage', data);
    switch (data.type) {
        case MESSAGES.HANDSHAKE:
            common.setSettings(data.settings);
            break;
        case MESSAGES.CONNECT:
            connect()
                .then(() => common.response({ id, type: RESPONSES.CONNECT, payload: true }))
                .catch(error => common.errorHandler({ id, error }));
            break;
        case MESSAGES.DISCONNECT:
            disconnect(data);
            break;
        case MESSAGES.GET_INFO:
            connect()
                .then(client => M.getInfo(client, common))
                .then(res =>
                    common.response({ id: data.id, type: RESPONSES.GET_INFO, payload: res })
                )
                .catch(error => common.errorHandler({ id: data.id, error }));
            break;
        case MESSAGES.GET_BLOCK_HASH:
            call(M.getBlockHash, data, RESPONSES.GET_BLOCK_HASH);
            break;
        case MESSAGES.GET_ACCOUNT_INFO:
            call(M.getAccountInfo, data, RESPONSES.GET_ACCOUNT_INFO);
            break;
        case MESSAGES.GET_ACCOUNT_UTXO:
            call(M.getAccountUtxo, data, RESPONSES.GET_ACCOUNT_UTXO);
            break;
        case MESSAGES.GET_TRANSACTION:
            call(M.getTransaction, data, RESPONSES.GET_TRANSACTION);
            break;
        case MESSAGES.GET_ACCOUNT_BALANCE_HISTORY:
            call(M.getAccountBalanceHistory, data, RESPONSES.GET_ACCOUNT_BALANCE_HISTORY);
            break;
        case MESSAGES.ESTIMATE_FEE:
            call(M.estimateFee, data, RESPONSES.ESTIMATE_FEE);
            break;
        case MESSAGES.PUSH_TRANSACTION:
            call(M.pushTransaction, data, RESPONSES.PUSH_TRANSACTION);
            break;
        case MESSAGES.SUBSCRIBE:
            connect()
                .then(() => {
                    switch (data.payload.type) {
                        case 'block':
                            return blockListener.subscribe();
                        case 'addresses':
                        case 'accounts':
                            return txListener.subscribe(data.payload);
                        default:
                            throw new CustomError(
                                `Subscription ${data.payload.type} not implemented`
                            );
                    }
                })
                .then(res =>
                    common.response({ id: data.id, type: RESPONSES.SUBSCRIBE, payload: res })
                )
                .catch(error => common.errorHandler({ id: data.id, error }));
            break;
        case MESSAGES.UNSUBSCRIBE:
            connect()
                .then(() => {
                    switch (data.payload.type) {
                        case 'block':
                            return blockListener.unsubscribe();
                        case 'addresses':
                        case 'accounts':
                            return txListener.unsubscribe(data.payload);
                        default:
                            throw new CustomError(
                                `Subscription ${data.payload.type} not implemented`
                            );
                    }
                })
                .then(res =>
                    common.response({ id: data.id, type: RESPONSES.UNSUBSCRIBE, payload: res })
                )
                .catch(error => common.errorHandler({ id: data.id, error }));
            break;
        // @ts-ignore this message is used in tests
        case 'terminate':
            cleanup();
            break;
        // @ts-ignore this message is used in tests
        case 'raw':
            connect()
                // @ts-ignore
                .then(client => client.request(data.payload.method, ...data.payload.params))
                .then(res =>
                    // @ts-ignore
                    common.response({ id, type: data.payload.method, payload: res })
                );
            break;
        default:
            common.errorHandler({
                id,
                error: new CustomError('worker_unknown_request', `+${type}`),
            });
            break;
    }
};

// Handshake to host
common.handshake();

export default ElectrumModule;
