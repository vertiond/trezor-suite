// This file is a wrapper for trezor-connect index.
// index is replaced in build time by webpack config.
// imports and exports are intentionally set to /lib directory otherwise webpack NormalModuleReplacementPlugin will replace this line as well.

// @ts-ignore /lib directory is not typed
import TrezorConnect from 'trezor-connect/lib';

// @ts-ignore /lib directory is not typed
export * from 'trezor-connect/lib';

// override each method of trezor-connect
// use ipcRenderer message instead of iframe.postMessage (see ./src-electron/preloader)
Object.keys(TrezorConnect).forEach(method => {
    TrezorConnect[method] = (...params: any[]) =>
        window.desktopApi?.TrezorConnect(method, ...params);
});

export default TrezorConnect;
