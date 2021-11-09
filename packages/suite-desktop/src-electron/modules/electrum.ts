import { ipcMain } from 'electron';
import { createSocket } from '@trezor/blockchain-link/src/workers/electrum/sockets';

let socket: ReturnType<typeof createSocket> | undefined;

const init = ({ mainWindow, store }: Dependencies) => {
    const { logger } = global;
    const debug = (...msg: string[]) => logger.debug('electrum', msg);
    const info = (...msg: string[]) => logger.info('electrum', msg);
    const warn = (...msg: string[]) => logger.warn('electrum', msg);

    const onConnect = () => {
        info('onConnect');
        mainWindow.webContents.send('electrum/connected');
    };

    const onClose = (e: unknown) => {
        info('onClose');
        mainWindow.webContents.send('electrum/closed', e);
    };

    const onReceive = (e: unknown) => {
        debug('onReceive', e as any);
        mainWindow.webContents.send('electrum/received', e);
    };

    const onEnd = (e: unknown) => {
        info('onEnd');
        mainWindow.webContents.send('electrum/ended', e);
    };

    const onError = (e: unknown) => {
        warn('onError', e as any);
        mainWindow.webContents.send('electrum/error', e);
    };

    ipcMain.handle('electrum/connect', (_, server: string, options?: SocketOptions) => {
        if (socket) {
            info('Closing previous connection');
            socket.close();
            socket = undefined;
        }
        const { address } = store.getTorSettings();
        const opts = {
            torAddress: address,
            ...(options || {}),
        };
        socket = createSocket(server, opts);
        return socket
            .connect({
                onConnect,
                onClose,
                onReceive,
                onEnd,
                onError,
            })
            .then(() => {
                info('Socket connected');
                return true;
            })
            .catch(() => false);
    });

    ipcMain.handle('electrum/close', () => {
        socket?.close();
        socket = undefined;
        info('Socket closed');
    });

    ipcMain.on('electrum/send', (_, msg: string) => {
        socket?.send(msg);
        debug('Message sent', msg);
    });
};

export default init;
