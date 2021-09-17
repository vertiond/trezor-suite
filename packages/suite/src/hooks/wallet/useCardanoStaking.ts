import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { Props, ContextValues } from '@wallet-types/cardanoStaking';
import trezorConnect, {
    CardanoCertificate,
    CardanoCertificateType,
    CardanoTxSigningMode,
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
    getChangeAddressParameters,
} from '@wallet-utils/cardanoUtils';
import { coinSelection, trezorUtils } from '@fivebinaries/coin-selection';
import { isTestnet } from '@suite/utils/wallet/accountUtils';

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
    const byron = account.accountType !== 'normal';
    const isStakingActive =
        account.networkType === 'cardano' ? account.misc.staking.isActive : false;

    const getCertificates = useCallback(() => {
        if (account.networkType !== 'cardano') return [];
        const result: CardanoCertificate[] = [
            {
                type: CardanoCertificateType.STAKE_DELEGATION,
                path: stakingPath,
                pool: trezorPoolId,
            },
        ];

        if (!isStakingActive) {
            result.unshift({
                type: CardanoCertificateType.STAKE_REGISTRATION,
                path: stakingPath,
            });
        }

        return result;
    }, [account.networkType, isStakingActive, stakingPath, trezorPoolId]);

    const composeTxPlan = useCallback(
        (action: 'delegate' | 'withdrawal') => {
            const changeAddress = getChangeAddressParameters(account);
            if (!changeAddress || account.networkType !== 'cardano') return null;
            const certificates = action === 'delegate' ? getCertificates() : [];
            const withdrawals =
                action === 'withdrawal'
                    ? [
                          {
                              amount: account.misc.staking.rewards,
                              path: stakingPath,
                              stakeAddress: account.misc.staking.address,
                          },
                      ]
                    : [];
            const txPlan = coinSelection(
                utxos,
                [],
                changeAddress.address,
                prepareCertificates(certificates),
                withdrawals,
                account.descriptor,
                {
                    byron,
                },
            );
            console.log('txPlan', txPlan);
            return { txPlan, certificates, withdrawals, changeAddress };
        },
        [account, byron, getCertificates, stakingPath, utxos],
    );

    const calculateFeeAndDeposit = useCallback(
        (action: 'delegate' | 'withdrawal') => {
            setLoading(true);
            try {
                const composeRes = composeTxPlan(action);
                if (composeRes) {
                    setFee(composeRes.txPlan.fee);
                    setDeposit(composeRes.txPlan.deposit);
                }
            } catch (err) {
                console.warn(err);
            }

            setLoading(false);
        },
        [composeTxPlan],
    );

    const signAndPushTransaction = async (action: 'delegate' | 'withdrawal') => {
        const composeRes = composeTxPlan(action);
        if (!composeRes || !account.utxo) return;

        const { txPlan, certificates, withdrawals, changeAddress } = composeRes;
        if (!txPlan || txPlan.type !== 'final') return;

        const res = await trezorConnect.cardanoSignTransaction({
            signingMode: CardanoTxSigningMode.ORDINARY_TRANSACTION,
            inputs: trezorUtils.transformToTrezorInputs(txPlan.inputs, account.utxo),
            outputs: trezorUtils.transformToTrezorOutputs(
                txPlan.outputs,
                changeAddress.addressParameters,
            ),
            fee: txPlan.fee,
            protocolMagic: getProtocolMagic(network.symbol),
            networkId: getNetworkId(network.symbol),
            ...(certificates.length > 0 ? { certificates } : {}),
            ...(withdrawals.length > 0 ? { withdrawals } : {}),
        });

        if (!res.success) {
            if (res.payload.error === 'tx-cancelled') return;
            addToast({
                type: 'sign-tx-error',
                error: res.payload.error,
            });
        } else {
            const signedTx = trezorUtils.signTransaction(txPlan.tx.body, res.payload.witnesses, {
                testnet: isTestnet(account.symbol),
            });
            const txHash = await trezorConnect.pushTransaction({
                tx: signedTx,
                coin: account.symbol,
            });
            // TODO:  notification
            fetchAndUpdateAccount(account);
        }
    };

    const delegate = async () => {
        setLoading(true);
        await signAndPushTransaction('delegate');
        setLoading(false);
    };

    const withdraw = async () => {
        setLoading(true);
        await signAndPushTransaction('withdrawal');
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
        calculateFeeAndDeposit,
    };
};

export const CardanoStakingContext = createContext<ContextValues | null>(null);
CardanoStakingContext.displayName = 'CardanoStakingContext';

export const useCardanoStakingContext = () => {
    const context = useContext(CardanoStakingContext);
    if (context === null) throw Error('CardanoStakingContext used without Context');
    return context;
};
