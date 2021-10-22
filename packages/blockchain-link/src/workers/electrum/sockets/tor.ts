import { SocksClient } from 'socks';
import { SocketBase, SocketConfig } from './base';
import { fail } from '../utils';
import type { SocketListener } from './interface';

type TorSocketConfig = SocketConfig & {
    torAddress: string;
};

export class TorSocket extends SocketBase {
    private torHost: string;
    private torPort: number;

    constructor({ torAddress, ...rest }: TorSocketConfig) {
        super(rest);
        const [host, port] = torAddress.split(':');
        this.torHost = host || fail(`Invalid tor host: ${torAddress}`);
        this.torPort = Number.parseInt(port, 10) || fail(`Invalid tor port: ${torAddress}`);
    }

    protected async openSocket(listener: SocketListener) {
        const { host, port, torHost, torPort } = this;
        const { socket } = await SocksClient.createConnection({
            set_tcp_nodelay: true,
            timeout: this.timeout,
            command: 'connect',
            destination: { host, port },
            proxy: { port: torPort, type: 5, ipaddress: torHost },
        }).catch(e => {
            listener.onError(e);
            throw e;
        });
        listener.onConnect();
        this.configureSocket(socket);
        this.bindSocket(socket, listener);
        return socket;
    }
}
