import { ipcMain } from 'electron';
import TrezorConnect, {
    DEVICE_EVENT,
    UI_EVENT,
    TRANSPORT_EVENT,
    BLOCKCHAIN_EVENT,
} from 'trezor-connect';

type Call = [keyof typeof TrezorConnect, ...any[]];

const init = ({ mainWindow }: Dependencies) => {
    // propagate all connect events using trezor-connect-event channel
    // real renderer listeners references are managed by desktopApi (see ./src-electron/preloader)
    TrezorConnect.on(DEVICE_EVENT, event => {
        mainWindow.webContents.send(`trezor-connect-event/${DEVICE_EVENT}`, event);
    });

    TrezorConnect.on(UI_EVENT, event => {
        mainWindow.webContents.send(`trezor-connect-event/${event.type}`, event.payload);
        mainWindow.webContents.send(`trezor-connect-event/${UI_EVENT}`, event);
    });

    TrezorConnect.on(TRANSPORT_EVENT, event => {
        mainWindow.webContents.send(`trezor-connect-event/${TRANSPORT_EVENT}`, event);
    });

    TrezorConnect.on(BLOCKCHAIN_EVENT, event => {
        mainWindow.webContents.send(`trezor-connect-event/${BLOCKCHAIN_EVENT}`, event);
    });

    ipcMain.handle('trezor-connect-call', (_event: any, [method, ...params]: Call) =>
        // @ts-ignore method name union problem
        TrezorConnect[method](...params),
    );
};

export default init;
