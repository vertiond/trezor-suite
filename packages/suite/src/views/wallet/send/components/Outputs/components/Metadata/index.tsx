import React from 'react';
import styled from 'styled-components';
import { Input, variables, Icon, useTheme } from '@trezor/components';
import { Translation } from '@suite-components';
import { InputError } from '@wallet-components';
import { useSendFormContext } from '@wallet-hooks';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { MAX_LENGTH } from '@suite-constants/inputs';

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const Remove = styled.div`
    display: flex;
    cursor: pointer;
    font-size: ${variables.FONT_SIZE.TINY};
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
    display: flex;
`;

interface Props {
    outputId: number;
}

const Metadata = ({ outputId }: Props) => {
    const { register, getDefaultValue, errors, setValue, composeTransaction } =
        useSendFormContext();

    const theme = useTheme();

    const isLabelEnabled = getDefaultValue(`outputs[${outputId}].labelEnabled`, false);
    if (!isLabelEnabled) return null;

    const inputName = `outputs[${outputId}].label`;
    const inputValue = getDefaultValue(inputName, '');
    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const error = outputError ? outputError.label : undefined;

    return (
        <Input
            state={getInputState(error, inputValue)}
            monospace
            innerAddon={
                <Remove
                    data-test={`outputs[${outputId}].removeLabeling`}
                    onClick={() => {
                        setValue(`outputs[${outputId}].label`, '');
                        setValue(`outputs[${outputId}].labelEnabled`, false);
                        composeTransaction(`outputs[${outputId}].amount`);
                    }}
                >
                    <StyledIcon
                        size={20}
                        color={theme.TYPE_LIGHT_GREY}
                        icon="CROSS"
                        useCursorPointer
                    />
                </Remove>
            }
            label={
                <Label>
                    <Translation id="RECIPIENT_LABEL" />
                </Label>
            }
            onChange={() => {
                composeTransaction(`outputs[${outputId}].amount`);
            }}
            bottomText={error && <InputError error={error} />}
            name={inputName}
            data-test={inputName}
            defaultValue={inputValue}
            maxLength={MAX_LENGTH.LABEL}
            innerRef={register()} // TODO: is validation necessary for this?
        />
    );
};

export default Metadata;
