/// <reference path="../../../../../suite/global.d.ts" />

import { fail } from '../utils';
import type { ISocket, SocketListener } from './interface';

export class ProxySocket implements ISocket {
    private api: DesktopApi;
    private server: string;
    private options?: SocketOptions;

    constructor(server: string, options?: SocketOptions) {
        // @ts-ignore window doesn't exist when building workers
        this.api = window?.parent?.desktopApi || fail('Desktop API cannot be found!');
        this.server = server;
        this.options = options;
    }

    async connect(listener: SocketListener) {
        this.bindEvents(listener);
        const success = await this.api.electrumConnect(this.server, this.options);
        if (!success) fail('Cannot connect');
    }

    close() {
        this.api.electrumClose();
    }

    send(msg: string) {
        this.api.electrumSend(msg);
    }

    private bindEvents(listener: SocketListener) {
        this.api.on('electrum/connected', () => listener.onConnect());
        this.api.on('electrum/received', chunk => listener.onReceive(chunk));
        this.api.on('electrum/ended', e => listener.onEnd(e));
        this.api.on('electrum/error', e => listener.onError(e));
        this.api.on('electrum/closed', e => listener.onClose(e));
    }
}
