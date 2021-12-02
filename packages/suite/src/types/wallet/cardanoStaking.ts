import { AppState } from '@suite-types';
import { Account } from '@wallet-types';
import { DerivationType } from '@wallet-types/cardano';

export interface ComponentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    derivationType: DerivationType;
}

export interface Props extends ComponentProps {
    selectedAccount: Extract<ComponentProps['selectedAccount'], { status: 'loaded' }>;
    derivationType: DerivationType;
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
    calculateFeeAndDeposit(action: 'delegate' | 'withdrawal'): void;
    error?: string;
};
