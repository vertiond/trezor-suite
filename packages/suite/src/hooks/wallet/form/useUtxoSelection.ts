import { useEffect } from 'react';
import { UseFormMethods } from 'react-hook-form';
import type { AccountUtxo } from 'trezor-connect';

type Props = UseFormMethods<{
    selectedUtxos?: AccountUtxo[];
}> & {
    composeRequest: (field?: string) => void;
};

// shareable sub-hook used in coinjoin
//  TODO: useSendForm + useRbfForm + exchange?

export const useUtxoSelection = ({ composeRequest, setValue, getValues, register }: Props) => {
    // register custom form field (without HTMLElement)
    useEffect(() => {
        register({ name: 'selectedUtxos', type: 'custom' });
    }, [register]);

    const toggleUtxoSelection = (utxo: AccountUtxo) => {
        const { selectedUtxos } = getValues();
        const isSelected = selectedUtxos?.find(u => u.txid === utxo.txid && u.vout === utxo.vout);
        if (isSelected) {
            setValue('selectedUtxos', selectedUtxos?.filter(u => u !== isSelected) ?? []);
        } else {
            setValue('selectedUtxos', (selectedUtxos || []).concat([utxo]));
        }
        composeRequest();
    };

    return {
        toggleUtxoSelection,
    };
};
