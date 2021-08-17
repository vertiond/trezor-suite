import React from 'react';
import { WalletLayout } from '@wallet-components';
import { AppState } from '@suite-types';
import { useCardanoStaking, CardanoStakingContext } from '@wallet-hooks/useCardanoStaking';
import { ComponentProps, Props } from '@wallet-types/cardanoStaking';
import Rewards from './components/Rewards';
import { connect } from 'react-redux';
import Stake from './components/Stake';

const mapStateToProps = (state: AppState): ComponentProps => ({
    selectedAccount: state.wallet.selectedAccount,
});

const CardanoStakingLoaded = (props: Props) => {
    const { selectedAccount } = props;
    const cardanoStakingValues = useCardanoStaking({ ...props, selectedAccount });
    const { isActive } = cardanoStakingValues;

    return (
        <WalletLayout title="TR_NAV_STAKING" account={selectedAccount} showEmptyHeaderPlaceholder>
            <CardanoStakingContext.Provider value={cardanoStakingValues}>
                {isActive && <Rewards />}
                {!isActive && <Stake />}
            </CardanoStakingContext.Provider>
        </WalletLayout>
    );
};

const CardanoStaking = (props: ComponentProps) => {
    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_STAKING" account={selectedAccount} />;
    }
    return <CardanoStakingLoaded {...props} selectedAccount={selectedAccount} />;
};

export default connect(mapStateToProps)(CardanoStaking);
