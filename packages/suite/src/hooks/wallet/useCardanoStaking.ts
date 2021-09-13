import { useEffect, useState, createContext, useContext } from 'react';
import { Props, ContextValues } from '@wallet-types/cardanoStaking';
import trezorConnect, {
    CardanoCertificate,
    CardanoCertificateType,
    CardanoWithdrawal,
} from 'trezor-connect';
import { useActions } from '@suite-hooks';
import * as notificationActions from '@suite-actions/notificationActions';
import * as accountActions from '@wallet-actions/accountActions';
import {
    getStakingPath,
    prepareCertificates,
    transformUtxos,
    getProtocolMagic,
    getNetworkId,
} from '@wallet-utils/cardanoUtils';
import { coinSelection, trezorUtils } from '@fivebinaries/coin-selection';

export const useCardanoStaking = (props: Props): ContextValues => {
    const URL_MAINNET = 'https://trezor-cardano-mainnet.blockfrost.io/api/v0/pools/';
    const URL_TESTNET = 'https://trezor-cardano-testnet.blockfrost.io/api/v0/pools/';

    const { addToast, fetchAndUpdateAccount } = useActions({
        addToast: notificationActions.addToast,
        fetchAndUpdateAccount: accountActions.fetchAndUpdateAccount,
    });

    const [trezorPoolId, setTrezorPoolId] = useState<undefined | string>(undefined);
    const [deposit, setDeposit] = useState<undefined | string>(undefined);
    const [loading, setLoading] = useState<boolean>(false);
    const [fee, setFee] = useState<undefined | string>(undefined);
    const { account, network } = props.selectedAccount;
    const utxos = transformUtxos(account.utxo);
    const stakingPath = getStakingPath(account.accountType, account.index);

    const getCertificates = () => {
        if (account.networkType !== 'cardano') return [];
        const result: CardanoCertificate[] = [
            {
                type: CardanoCertificateType.STAKE_DELEGATION,
                path: stakingPath,
                pool: trezorPoolId,
            },
        ];

        if (!account.misc.staking.isActive) {
            result.unshift({
                type: CardanoCertificateType.STAKE_REGISTRATION,
                path: stakingPath,
            });
        }

        return result;
    };

    const composeTx = () => {
        if (!account.addresses || account.networkType !== 'cardano') return;
        setLoading(true);
        const changeAddress = {
            ...account.addresses.change[0],
            stakingPath,
        };
        const certificates = getCertificates();
        const res = coinSelection(
            utxos,
            [],
            changeAddress,
            prepareCertificates(certificates),
            [],
            false,
            account.accountType !== 'normal',
        );

        setFee(res.fee);
        setDeposit(res.deposit);
        setLoading(false);
    };

    const delegate = async () => {
        if (!account.addresses || account.networkType !== 'cardano') return;
        setLoading(true);
        const certificates = getCertificates();
        const changeAddress = {
            ...account.addresses.change[0],
            stakingPath,
        };
        const selectedResult = coinSelection(
            utxos,
            [],
            changeAddress,
            prepareCertificates(certificates),
            [],
            false,
            account.accountType !== 'normal',
        );

        const signedTx = await trezorConnect.cardanoSignTransaction({
            inputs: selectedResult.inputs.map(i =>
                trezorUtils.transformToTrezorInput(
                    i,
                    account.utxo!.find(u => u.txid === i.txHash && u.vout === i.outputIndex)!.path,
                ),
            ),
            outputs: selectedResult.outputs.map(o => trezorUtils.transformToTrezorOutput(o)),
            fee: selectedResult.fee,
            certificates,
            protocolMagic: getProtocolMagic(network.symbol),
            networkId: getNetworkId(network.symbol),
        });

        if (signedTx.success) {
            const pushed = await trezorConnect.pushTransaction({
                tx: signedTx.payload.serializedTx,
                coin: account.symbol,
            });
            fetchAndUpdateAccount(account);
            console.log('pushed', pushed);
        }

        setLoading(false);
    };

    const withdraw = async () => {
        if (!account.addresses || account.networkType !== 'cardano') return;
        setLoading(true);
        const changeAddress = {
            ...account.addresses.unused[0],
            stakingPath,
        };
        const withdrawals: CardanoWithdrawal[] = [
            { amount: account.misc.staking.rewards, path: stakingPath },
        ];
        const selectedResult = coinSelection(
            utxos,
            [],
            changeAddress,
            [],
            withdrawals,
            false,
            account.accountType !== 'normal',
        );
        const signedTx = await trezorConnect.cardanoSignTransaction({
            inputs: selectedResult.inputs.map(i =>
                trezorUtils.transformToTrezorInput(
                    i,
                    account.utxo!.find(u => u.txid === i.txHash && u.vout === i.outputIndex)!.path,
                ),
            ),
            outputs: selectedResult.outputs.map(o => trezorUtils.transformToTrezorOutput(o)),
            fee: selectedResult.fee,
            withdrawals,
            protocolMagic: getProtocolMagic(network.symbol),
            networkId: getNetworkId(network.symbol),
        });

        if (!signedTx.success) {
            if (signedTx.payload.error === 'tx-cancelled') return;
            addToast({
                type: 'sign-tx-error',
                error: signedTx.payload.error,
            });
        } else {
            const pushed = await trezorConnect.pushTransaction({
                tx: signedTx.payload.serializedTx,
                coin: account.symbol,
            });
            console.log('pushed', pushed);
            fetchAndUpdateAccount(account);
        }

        setLoading(false);
    };

    useEffect(() => {
        const fetchTrezorPoolId = async () => {
            setLoading(true);
            const url = network.testnet ? URL_TESTNET : URL_MAINNET;
            try {
                const response = await fetch(url, { credentials: 'same-origin' });
                const responseJson: { pool: string } = await response.json();
                setTrezorPoolId(responseJson.pool);
                setLoading(false);
            } catch (err) {
                console.log('err', err);
            }
            setLoading(false);
        };

        if (!trezorPoolId) {
            fetchTrezorPoolId();
        }
    }, [setTrezorPoolId, network, trezorPoolId]);

    return {
        account,
        deposit,
        fee,
        registeredPoolId: account.networkType === 'cardano' ? account.misc.staking.poolId : null,
        isActive: account.networkType === 'cardano' ? account.misc.staking.isActive : false,
        rewards: account.networkType === 'cardano' ? account.misc.staking.rewards : '0',
        address: account.networkType === 'cardano' ? account.misc.staking.address : '',
        trezorPoolId,
        delegate,
        withdraw,
        loading,
        composeTx,
    };
};

export const CardanoStakingContext = createContext<ContextValues | null>(null);
CardanoStakingContext.displayName = 'CardanoStakingContext';

export const useCardanoStakingContext = () => {
    const context = useContext(CardanoStakingContext);
    if (context === null) throw Error('CardanoStakingContext used without Context');
    return context;
};
