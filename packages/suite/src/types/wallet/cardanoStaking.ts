import { AppState } from '@suite-types';
import { Account } from '@wallet-types';

export interface ComponentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
}

export interface Props extends ComponentProps {
    selectedAccount: Extract<ComponentProps['selectedAccount'], { status: 'loaded' }>;
}

export type ContextValues = {
    account: Account;
    address: string;
    loading: boolean;
    fee?: string;
    deposit?: string;
    registeredPoolId: string | null;
    trezorPoolId?: string;
    isActive: boolean;
    rewards: string;
    delegate(): void;
    withdraw(): void;
    composeTx(): void;
};
