import React from 'react';
import styled from 'styled-components';
import { SettingsLayout } from '@settings-components';
import { CoinsGroup, Card } from '@suite-components';
import { useSelector, useActions } from '@suite-hooks';
import { NETWORKS } from '@wallet-config';
import { Network } from '@wallet-types';
import * as walletSettingsActions from '@settings-actions/walletSettingsActions';

const StyledSettingsLayout = styled(SettingsLayout)`
    & > * + * {
        margin-top: 16px;
    }
`;

const Settings = () => {
    const { changeCoinVisibility } = useActions({
        changeCoinVisibility: walletSettingsActions.changeCoinVisibility,
    });
    const { enabledNetworks } = useSelector(state => ({
        enabledNetworks: state.wallet.settings.enabledNetworks,
    }));

    const enabledMainnetNetworks: Network['symbol'][] = [];
    const enabledTestnetNetworks: Network['symbol'][] = [];

    enabledNetworks.forEach(symbol => {
        const network = NETWORKS.find(n => n.symbol === symbol);
        if (!network) return;
        if (network.testnet) {
            enabledTestnetNetworks.push(network.symbol);
        } else {
            enabledMainnetNetworks.push(network.symbol);
        }
    });

    const mainnetNetworks = NETWORKS.filter(n => !n.accountType && !n.testnet);
    const testnetNetworks = NETWORKS.filter(n => !n.accountType && n?.testnet === true);

    return (
        <StyledSettingsLayout>
            <Card>
                <CoinsGroup
                    onToggleFn={changeCoinVisibility}
                    networks={mainnetNetworks}
                    enabledNetworks={enabledMainnetNetworks}
                    testnet={false}
                />
            </Card>
            <Card>
                <CoinsGroup
                    onToggleFn={changeCoinVisibility}
                    networks={testnetNetworks}
                    enabledNetworks={enabledTestnetNetworks}
                    testnet
                />
            </Card>
        </StyledSettingsLayout>
    );
};

export default Settings;
