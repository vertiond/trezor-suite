import React, { useRef, useLayoutEffect, useState } from 'react';
import styled from 'styled-components';
import {
    variables,
    CoinLogo,
    IconProps,
    useTheme,
    Button,
    Icon,
    Dropdown,
} from '@trezor/components';
import { FiatValue, FormattedCryptoAmount, AccountLabeling, Translation } from '@suite-components';
import { useSelector, useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import { Route } from '@suite-types';

const { FONT_WEIGHT, FONT_SIZE } = variables;

const SECONDARY_MENU_BUTTON_MARGIN = '12px';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    scrollbar-width: none; /* Firefox */
    justify-content: space-between;
    position: relative;
    height: 68px;

    &::-webkit-scrollbar {
        /* WebKit */
        width: 0;
        height: 0;
    }
`;

const Primary = styled.div`
    display: flex;
`;

const Secondary = styled.div`
    display: flex;
    align-items: center;
`;

const SecondaryMenu = styled.div<{ visible: boolean }>`
    display: flex;
    align-items: center;
    ${props => !props.visible && `opacity: 0;`}
    & > * + * {
        margin-left: ${SECONDARY_MENU_BUTTON_MARGIN};
    }
`;

const SecondaryMenuCondensed = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    z-index: 3;
    background: ${props => props.theme.BG_WHITE};
    background: linear-gradient(
        90deg,
        transparent 0%,
        ${props => props.theme.BG_WHITE} 10%,
        ${props => props.theme.BG_WHITE} 100%
    );
    height: 100%;
    width: 70px;
    margin: 0 -33px 0;
    padding: 20px 25px 0 13px;
`;

const StyledNavLink = styled.div<{ active?: boolean }>`
    cursor: pointer;
    font-size: ${FONT_SIZE.NORMAL};
    color: ${props =>
        props.active ? props => props.theme.TYPE_DARK_GREY : props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    display: flex;
    align-items: center;
    padding: 23px 10px;
    white-space: nowrap;
    border-bottom: 2px solid
        ${props => (props.active ? props => props.theme.TYPE_DARK_GREY : 'transparent')};
    margin-right: 40px;
    &:last-child {
        margin-right: ${SECONDARY_MENU_BUTTON_MARGIN};
    }
`;

const IconWrapper = styled.div`
    margin-right: 10px;
`;

const StyledBackLink = styled.div`
    cursor: pointer;
    font-size: ${FONT_SIZE.SMALL};
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    display: flex;
    align-items: center;
    padding: 23px 0 25px;
    white-space: nowrap;
`;

const Text = styled.div`
    position: relative;
`;

const StyledIcon = styled(Icon)`
    margin-right: 10px;
`;

const StyledDropdown = styled(Dropdown)`
    background: ${props => props.theme.BG_GREY};
    width: 38px;
    height: 38px;
    border-radius: 4px;
    & > * {
        width: 100%;
        height: 100%;
    }
`;

// TODO - maybe add to global styleguide when used elsewhere
const StyledButton = styled(Button)`
    font-size: ${FONT_SIZE.NORMAL};
    font-weight: ${FONT_WEIGHT.DEMI_BOLD};
    padding-left: 20px;
    padding-right: 20px;
`;

export type AppNavigationItem = {
    id: string;
    callback: () => void;
    title: JSX.Element;
    position: 'primary' | 'secondary';
    extra?: boolean;
    icon?: IconProps['icon'];
    'data-test'?: string;
    isHidden?: () => boolean;
};

const Main = styled.div<{ inView: boolean }>`
    ${props =>
        !props.inView
            ? `
            display: flex;`
            : `
            display: none;
`}
    align-items: center;
`;

const BalanceWrapperContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin: 0 0 0 13px;
`;

const Balance = styled.div`
    white-space: nowrap;
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const FiatBalanceWrapper = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-left: 0.5ch;
`;

const LabelWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0 13px 0 0;
`;

const BalanceInner = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledFiatValue = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface Props {
    items: AppNavigationItem[];
    primaryContent?: React.ReactNode;
    account?: Account;
    inView: boolean;
}
interface MenuWidths {
    primary: number;
    secondary: number;
    wrapper: number;
}

const isRouteActive = (routeName?: Route['name'], id?: string): boolean => routeName === id;

const isSubsection = (routeName: Route['name']): boolean =>
    !(
        routeName.startsWith('settings') ||
        routeName === 'wallet-index' ||
        routeName === 'wallet-details' ||
        routeName === 'wallet-tokens'
    );

const isSecondaryMenuOverflown = ({ primary, secondary, wrapper }: MenuWidths) =>
    primary + secondary >= wrapper;

const AppNavigation = ({ items, primaryContent, account, inView }: Props) => {
    const theme = useTheme();
    const [condensedSecondaryMenuVisible, setCondensedSecondaryMenuVisible] = useState<boolean>(
        false,
    );
    const wrapper = useRef<HTMLDivElement>(null);
    const primary = useRef<HTMLDivElement>(null);
    const secondary = useRef<HTMLDivElement>(null);
    const { routeName, screenWidth } = useSelector(state => ({
        routeName: state.router.route?.name,
        screenWidth: state.resize.screenWidth,
    }));
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    useLayoutEffect(() => {
        if (primary.current && secondary.current && wrapper.current) {
            setCondensedSecondaryMenuVisible(
                isSecondaryMenuOverflown({
                    primary: primary.current.getBoundingClientRect().width,
                    secondary: secondary.current.getBoundingClientRect().width,
                    wrapper: wrapper.current.getBoundingClientRect().width,
                }),
            );
        }
    }, [wrapper, primary, secondary, screenWidth]);

    const itemsPrimary = items.filter(item => item.position === 'primary');
    const itemsSecondary = items.filter(item => item.position === 'secondary');
    const itemsSecondaryWithExtra = itemsSecondary.filter(item => item.extra);
    const itemsSecondaryWithoutExtra = itemsSecondary.filter(item => !item.extra);

    if (!account) return null;

    const { symbol, formattedBalance } = account;

    return (
        <Wrapper ref={wrapper}>
            {routeName && isSubsection(routeName) ? (
                <Primary>
                    <Main inView={inView}>
                        <CoinLogo size={22} symbol={symbol} />
                        <BalanceWrapperContainer>
                            <LabelWrapper>
                                <AccountLabeling account={account} />
                            </LabelWrapper>
                            <BalanceInner>
                                <Balance>
                                    <FormattedCryptoAmount
                                        value={formattedBalance}
                                        symbol={symbol}
                                    />
                                </Balance>
                                <StyledFiatValue>
                                    <FiatValue
                                        amount={formattedBalance}
                                        symbol={symbol}
                                        showApproximationIndicator
                                    >
                                        {({ value }) =>
                                            value ? (
                                                <FiatBalanceWrapper>{value}</FiatBalanceWrapper>
                                            ) : null
                                        }
                                    </FiatValue>
                                </StyledFiatValue>
                            </BalanceInner>
                        </BalanceWrapperContainer>
                    </Main>
                    <StyledBackLink onClick={() => goto('wallet-index', undefined, true)}>
                        <StyledIcon icon="ARROW_LEFT" size={16} />
                        <Translation id="TR_BACK" />
                    </StyledBackLink>
                </Primary>
            ) : (
                <>
                    <Primary ref={primary}>
                        {primaryContent ||
                            itemsPrimary.map(item => {
                                const { id, title } = item;
                                const active = isRouteActive(routeName, id);
                                return (
                                    <StyledNavLink
                                        key={id}
                                        active={active}
                                        onClick={item.callback}
                                        {...(item['data-test'] && {
                                            'data-test': item['data-test'],
                                        })}
                                    >
                                        {item.icon && (
                                            <IconWrapper>
                                                <Icon
                                                    size={18}
                                                    icon={item.icon}
                                                    color={
                                                        active ? theme.TYPE_DARK_GREY : undefined
                                                    }
                                                />
                                            </IconWrapper>
                                        )}

                                        <Text>{title}</Text>
                                    </StyledNavLink>
                                );
                            })}
                    </Primary>
                    <Secondary ref={secondary}>
                        {condensedSecondaryMenuVisible && (
                            <SecondaryMenuCondensed>
                                <Dropdown
                                    alignMenu="right"
                                    offset={8}
                                    items={[
                                        {
                                            key: 'all',
                                            options: itemsSecondary.map(item => {
                                                const { id, title } = item;
                                                return {
                                                    key: id,
                                                    callback: () => {
                                                        item.callback();
                                                        return true;
                                                    },
                                                    label: title,
                                                };
                                            }),
                                        },
                                    ]}
                                />
                            </SecondaryMenuCondensed>
                        )}
                        <SecondaryMenu visible={!condensedSecondaryMenuVisible}>
                            {itemsSecondaryWithoutExtra.map(item => {
                                const { id, title } = item;
                                return (
                                    <StyledButton
                                        key={id}
                                        variant={
                                            id === 'wallet-coinmarket-buy' ? 'primary' : 'secondary'
                                        }
                                        onClick={item.callback}
                                        {...(item['data-test'] && {
                                            'data-test': item['data-test'],
                                        })}
                                        isDisabled={condensedSecondaryMenuVisible}
                                    >
                                        <Text>{title}</Text>
                                    </StyledButton>
                                );
                            })}
                            {itemsSecondaryWithExtra.length ? (
                                <StyledDropdown
                                    alignMenu="right"
                                    offset={5}
                                    items={[
                                        {
                                            key: 'extra',
                                            options: itemsSecondaryWithExtra.map(item => {
                                                const { id, title } = item;
                                                return {
                                                    key: id,
                                                    callback: () => {
                                                        item.callback();
                                                        return true;
                                                    },
                                                    label: title,
                                                };
                                            }),
                                        },
                                    ]}
                                />
                            ) : undefined}
                        </SecondaryMenu>
                    </Secondary>
                </>
            )}
        </Wrapper>
    );
};

export default AppNavigation;
