import TrezorConnect, { UI } from 'trezor-connect';
import { MODAL, SUITE } from '@suite-actions/constants';
import { Route, Dispatch, GetState, TrezorDevice } from '@suite-types';
import { Account, WalletAccountTransaction } from '@wallet-types';
import { createDeferred, Deferred, DeferredResponse } from '@suite-utils/deferred';
import type { getProtocolInfo } from '@suite-utils/parseUri';

export type UserContextPayload =
    | {
          type: 'qr-reader';
          decision: Deferred<ReturnType<typeof getProtocolInfo>>;
          allowPaste?: boolean;
      }
    | {
          type: 'unverified-address';
          device: TrezorDevice;
          address: string;
          addressPath: string;
          symbol: Account['symbol'];
          networkType: Account['networkType'];
      }
    | {
          type: 'address';
          device: TrezorDevice;
          address: string;
          addressPath: string;
          symbol: Account['symbol'];
          networkType: Account['networkType'];
          confirmed?: boolean;
          cancelable?: boolean;
      }
    | {
          type: 'xpub';
          xpub: string;
          accountPath: string;
          accountIndex: number;
          accountType: Account['accountType'];
          symbol: Account['symbol'];
          accountLabel: Account['metadata']['accountLabel'];
      }
    | {
          type: 'passphrase-duplicate';
          device: TrezorDevice;
          duplicate: TrezorDevice;
      }
    | {
          type: 'add-account';
          device: TrezorDevice;
          symbol?: Account['symbol'];
          noRedirect?: boolean;
      }
    | {
          type: 'device-background-gallery';
          device: TrezorDevice;
      }
    | {
          type: 'transaction-detail';
          tx: WalletAccountTransaction;
          rbfForm?: boolean;
      }
    | {
          type: 'review-transaction';
          decision: Deferred<boolean>;
      }
    | {
          type: 'import-transaction';
          decision: Deferred<{ [key: string]: string }[]>;
      }
    | {
          type: 'coinmarket-buy-terms';
          provider?: string;
          decision: Deferred<boolean>;
      }
    | {
          type: 'coinmarket-sell-terms';
          provider?: string;
          decision: Deferred<boolean>;
      }
    | {
          type: 'coinmarket-leave-spend';
          routeToContinue?: Route['name'];
      }
    | {
          type: 'coinmarket-exchange-terms';
          provider?: string;
          decision: Deferred<boolean>;
      }
    | {
          type: 'coinmarket-exchange-dex-terms';
          provider?: string;
          decision: Deferred<boolean>;
      }
    | {
          type: 'log';
      }
    | {
          type: 'pin-mismatch';
      }
    | {
          type: 'wipe-device';
      }
    | {
          type: 'disconnect-device';
      }
    | {
          type: 'metadata-provider';
          decision: Deferred<boolean>;
      }
    | {
          type: 'advanced-coin-settings';
          coin: Account['symbol'];
      }
    | {
          type: 'add-token';
      }
    | {
          type: 'safety-checks';
      };

export type ModalAction =
    | {
          type: typeof MODAL.CLOSE;
      }
    | {
          type: typeof MODAL.OPEN_USER_CONTEXT;
          payload: UserContextPayload;
      };

export const onCancel = (): ModalAction => ({
    type: MODAL.CLOSE,
});

/**
 * Called from <PinModal /> component
 * Sends pin to `trezor-connect`
 * @param {string} payload
 * @returns
 */
export const onPinSubmit = (payload: string) => () => {
    TrezorConnect.uiResponse({ type: UI.RECEIVE_PIN, payload });
};

export const onPinCancel = () => {
    TrezorConnect.cancel('pin-cancelled');
};

/**
 * Called from <PassphraseModal /> component
 * Sends passphrase to `trezor-connect`
 * @param {string} value
 * @param {boolean} passphraseOnDevice
 * @param {boolean} hasEmptyPassphraseWallet
 */
export const onPassphraseSubmit =
    (value: string, passphraseOnDevice: boolean) => (dispatch: Dispatch, getState: GetState) => {
        const { device } = getState().suite;
        if (!device) return;

        if (!device.state) {
            // call SUITE.UPDATE_PASSPHRASE_MODE action to set or remove walletNumber
            dispatch({
                type: SUITE.UPDATE_PASSPHRASE_MODE,
                payload: device,
                hidden: passphraseOnDevice || value,
                alwaysOnDevice: passphraseOnDevice,
            });
        }

        TrezorConnect.uiResponse({
            type: UI.RECEIVE_PASSPHRASE,
            payload: {
                value,
                save: true,
                passphraseOnDevice,
            },
        });
    };

export const onReceiveConfirmation = (confirmation: boolean) => (dispatch: Dispatch) => {
    TrezorConnect.uiResponse({
        type: UI.RECEIVE_CONFIRMATION,
        payload: confirmation,
    });

    dispatch(onCancel());
};

export const openModal = (payload: UserContextPayload): ModalAction => ({
    type: MODAL.OPEN_USER_CONTEXT,
    payload,
});

// declare all modals with promises
type DeferredModals = Extract<
    UserContextPayload,
    {
        type:
            | 'qr-reader'
            | 'review-transaction'
            | 'import-transaction'
            | 'coinmarket-buy-terms'
            | 'coinmarket-sell-terms'
            | 'coinmarket-exchange-dex-terms'
            | 'coinmarket-exchange-terms';
    }
>;
// extract single modal by `type` util
type DeferredModal<T extends DeferredModals['type']> = Extract<DeferredModals, { type: T }>;
// extract params except for `type` and 'decision` util
type DeferredRest<T extends DeferredModals['type']> = Omit<DeferredModal<T>, 'type' | 'decision'>;
// openDeferredModal params (without `decision` field)
type DeferredPayload<T extends DeferredModals['type']> = { type: T } & DeferredRest<T>;

// this overload doesn't work when wrapped by `bindActionCreators` (returns union, TODO: investigate...)
export const openDeferredModal =
    <T extends DeferredModals['type']>(payload: DeferredPayload<T>) =>
    (dispatch: Dispatch) => {
        const dfd = createDeferred<DeferredResponse<DeferredModal<T>['decision']>>();
        dispatch({
            type: MODAL.OPEN_USER_CONTEXT,
            payload: {
                ...payload,
                decision: dfd,
            },
        });
        try {
            return dfd.promise;
        } catch (error) {
            // do nothing, return void
        }
    };
