import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';

const Wrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    &:after {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        z-index: 1;
        border-radius: ${variables.BORDER_RADIUS.HOVER};
        transition: all ${variables.HOVER_TRANSITION.DURATION}
            ${variables.HOVER_TRANSITION.ANIMATION};
        background-color: transparent;
    }

    &:hover,
    &:focus,
    &:active {
        &:after {
            background-color: ${props => props.theme.BG_HOVER_ITEM};
            top: -12px;
            left: -12px;
            bottom: -12px;
            right: -12px;
        }
    }
`;

const HoverAnimation = (props: any) => <Wrapper>{props.children}</Wrapper>;

export default HoverAnimation;
