import TrezorConnect, {
    DEVICE_EVENT,
    UI_EVENT,
    TRANSPORT_EVENT,
    BLOCKCHAIN_EVENT,
} from 'trezor-connect';
import { SUITE } from '@suite-actions/constants';
import { lockDevice } from '@suite-actions/suiteActions';
import { resolveStaticPath } from '@suite-utils/build';
import { Dispatch, GetState } from '@suite-types';
import { isWeb } from '@suite-utils/env';

export const init = () => async (dispatch: Dispatch, getState: GetState) => {
    // set event listeners and dispatch as
    TrezorConnect.on(DEVICE_EVENT, ({ event: _, ...action }) => {
        // dispatch event as action
        dispatch(action);
    });

    TrezorConnect.on(UI_EVENT, ({ event: _, ...action }) => {
        // dispatch event as action
        dispatch(action);
    });

    TrezorConnect.on(TRANSPORT_EVENT, ({ event: _, ...action }) => {
        // dispatch event as action
        dispatch(action);
    });

    TrezorConnect.on(BLOCKCHAIN_EVENT, ({ event: _, ...action }) => {
        // dispatch event as action
        dispatch(action);
    });

    const wrappedMethods = [
        'getFeatures',
        'getDeviceState',
        'getAddress',
        'ethereumGetAddress',
        'rippleGetAddress',
        'applySettings',
        'changePin',
        'pushTransaction',
        'ethereumSignTransaction',
        'signTransaction',
        'rippleSignTransaction',
        'backupDevice',
        'recoveryDevice',
    ] as const;
    wrappedMethods.forEach(key => {
        // typescript complains about params and return type, need to be "any"
        const original: any = TrezorConnect[key];
        if (!original) return;
        (TrezorConnect[key] as any) = async (params: any) => {
            dispatch(lockDevice(true));
            const result = await original(params);
            dispatch(lockDevice(false));
            return result;
        };
    });

    try {
        const connectSrc = resolveStaticPath('connect/');
        // 'https://localhost:8088/';
        // 'https://connect.corp.sldev.cz/develop/';

        await TrezorConnect.init({
            connectSrc,
            transportReconnect: true,
            debug: false,
            popup: false,
            webusb: isWeb(),
            pendingTransportEvent: getState().devices.length < 1,
            manifest: {
                email: 'info@trezor.io',
                appUrl: '@trezor/suite',
            },
        });

        /* TODO better mechanism for enforcing specific backend needed */
        const electrum = new URLSearchParams(window.location.search).get('electrum');
        console.log('SETTING ELECTRUM', electrum);
        if (electrum) {
            localStorage.setItem('electrum', electrum);
            await TrezorConnect.blockchainSetCustomBackend({
                coin: 'btc',
                blockchainLink: {
                    type: 'electrum',
                    url: [electrum],
                },
            });
        } else {
            localStorage.removeItem('electrum');
        }
        /* */

        dispatch({
            type: SUITE.CONNECT_INITIALIZED,
        });
    } catch (error) {
        let formattedError: string;
        if (typeof error === 'string') {
            formattedError = error;
        } else {
            formattedError = error.code ? `${error.code}: ${error.message}` : error.message;
        }
        dispatch({
            type: SUITE.ERROR,
            error: formattedError,
        });
    }
};
