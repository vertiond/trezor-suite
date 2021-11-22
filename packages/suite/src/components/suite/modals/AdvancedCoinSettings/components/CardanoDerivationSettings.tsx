import React from 'react';
import styled from 'styled-components';
import { variables, Select } from '@trezor/components';
import { Translation } from '@suite-components/Translation';
import { DerivationType } from '@wallet-types/cardano';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    text-align: left;
`;

const Description = styled.span`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: 500;
    line-height: 1.57;
`;

const Heading = styled.span`
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: 500;
    line-height: 1.5;
    margin-bottom: 6px;
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
`;

const Left = styled.div`
    margin: 10px 0 20px 0;
`;

interface Props {
    setBlockfrostCardanoDerivationType: (blockfrostCardanoDerivationType: DerivationType) => void;
    blockfrostCardanoDerivationType: DerivationType;
}

const CardanoDerivationSettings = ({
    setBlockfrostCardanoDerivationType,
    blockfrostCardanoDerivationType,
}: Props) => (
    <Wrapper>
        {console.log(blockfrostCardanoDerivationType)}
        <Heading>
            <Translation id="SETTINGS_ADV_CARDANO_DERIVATION_TITLE" />
        </Heading>
        <Description>
            <Translation id="SETTINGS_ADV_CARDANO_DERIVATION_DESCRIPTION" />
        </Description>
        <Row>
            <Left>
                <Select
                    hideTextCursor
                    useKeyPressScroll
                    width={170}
                    noTopLabel
                    value={blockfrostCardanoDerivationType}
                    options={[
                        { label: 'Icarus', value: 1 },
                        { label: 'Icarus Trezor', value: 2 },
                        // { label: 'Ledger', value: 0 },
                    ]}
                    onChange={(option: DerivationType) => {
                        setBlockfrostCardanoDerivationType(option);
                    }}
                    data-test="@select/cardano-derivation-type"
                />
            </Left>
        </Row>
    </Wrapper>
);

export default CardanoDerivationSettings;
