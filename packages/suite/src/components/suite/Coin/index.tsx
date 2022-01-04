import React from 'react';
import { transparentize } from 'polished';
import styled, { css } from 'styled-components';
import { variables, CoinLogo, Icon, useTheme } from '@trezor/components';
import { Translation } from '@suite-components';
import { useActions } from '@suite-hooks';
import { openModal as openModalAction } from '@suite-actions/modalActions';
import type { ExtendedMessageDescriptor } from '@suite-types';
import type { Network } from '@wallet-types';
import type { BackendSettings } from '@wallet-reducers/settingsReducer';

const SettingsWrapper = styled.div`
    display: flex;
    align-self: stretch;
    align-items: center;
    border-radius: 100%;
    margin-right: -30px;
    padding: 0 10px;
    overflow: hidden;
    transition: 0.3s ease;
    position: relative;
    opacity: 0;
    &:hover {
        background-color: ${props =>
            transparentize(
                props.theme.HOVER_TRANSPARENTIZE_FILTER,
                props.theme.HOVER_PRIMER_COLOR,
            )};
    }
`;

const ImageWrapper = styled.div`
    display: flex;
    justify-items: flex-start;
    margin-right: 12px;
    margin-left: 12px;
    position: relative;
    transition: 0.3s ease;
    opacity: 1;
`;

const CoinWrapper = styled.button<{ selected: boolean; disabled: boolean }>`
    display: flex;
    justify-items: flex-start;
    align-items: center;
    border: 1.5px solid ${props => props.theme.STROKE_GREY};
    background: ${props => props.theme.BG_WHITE};
    border-radius: 9999px;
    margin: 0 13px 18px 0;
    height: 47px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${props => props.theme.TYPE_DARK_GREY};
    cursor: pointer;
    transition: 0.3s ease;
    overflow: hidden;

    ${props =>
        !props.disabled &&
        css`
            &:hover ${SettingsWrapper} {
                margin-right: 0;
                opacity: 1;
            }

            &:hover ${ImageWrapper} {
                margin-left: -18px;
                opacity: 0;
            }
        `}

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
        background: ${props => props.theme.BG_GREY};
    }
    ${props =>
        props.selected &&
        !props.disabled &&
        css`
            border-color: ${props.theme.BG_GREEN};
        `}
`;

const Name = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    margin-top: 1px;
`;

const NameWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-right: 10px;
`;

const NameLabeled = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    line-height: 0.86;
    margin-bottom: 3px;
`;

const Label = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 0.75;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const Check = styled.div<{ visible: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: ${props => props.theme.BG_GREEN};
    width: 12px;
    height: 12px;
    position: absolute;
    top: -2px;
    right: -2px;
    opacity: 0;
    transition: opacity 0.3s ease;
    ${props => props.visible && `opacity: 1;`}
`;

interface Props extends React.HTMLAttributes<HTMLButtonElement> {
    symbol: Network['symbol'];
    backend?: Omit<BackendSettings, 'coin'>;
    name: Network['name'];
    label?: ExtendedMessageDescriptor['id'];
    selected: boolean;
    disabled?: boolean;
}

const Coin = ({
    symbol,
    backend,
    name,
    label,
    selected = false,
    disabled = false,
    ...props
}: Props) => {
    const theme = useTheme();

    const { openModal } = useActions({
        openModal: openModalAction,
    });

    const openSettings = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (disabled) return;
        openModal({
            type: 'advanced-coin-settings',
            coin: symbol,
        });
    };

    const note = backend && !backend.tor ? 'TR_CUSTOM_BACKEND' : label;

    return (
        <CoinWrapper selected={selected} disabled={disabled} {...props}>
            <ImageWrapper>
                <CoinLogo size={24} symbol={symbol} />
                <Check visible={selected}>
                    <Icon size={8} color={theme.TYPE_WHITE} icon="CHECK" />
                </Check>
            </ImageWrapper>
            {note ? (
                <NameWrapper>
                    <NameLabeled>{name}</NameLabeled>
                    <Label>
                        <Translation id={note} />
                    </Label>
                </NameWrapper>
            ) : (
                <Name>{name}</Name>
            )}
            <SettingsWrapper onClick={openSettings}>
                <Icon icon="SETTINGS" />
            </SettingsWrapper>
        </CoinWrapper>
    );
};

export default Coin;
