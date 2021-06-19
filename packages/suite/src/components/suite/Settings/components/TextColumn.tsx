import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { Translation, ExternalLink } from '@suite-components';

interface TextColumnProps {
    title?: React.ReactNode;
    description?: React.ReactNode;
    learnMore?: string;
}

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    text-align: left;
    margin-right: 16px;
    max-width: 500px;
`;

const Description = styled.div`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-bottom: 12px;
    margin-top: 12px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    &:last-child {
        margin-bottom: 0px;
    }
`;

const Title = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const StyledExternalLink = styled(ExternalLink)`
    position: relative;
    padding: 4px 6px;
    margin-left: -4px;
    &:after {
        content: '';
        position: absolute;
        border-radius: ${variables.BORDER_RADIUS.HOVER};
        transition: all ${variables.HOVER_TRANSITION.DURATION}
            ${variables.HOVER_TRANSITION.ANIMATION};
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        background: transparent;
    }
`;

const StyledExternalLinkWrapper = styled.div`
    &:hover ${StyledExternalLink} {
        text-decoration: none;
        &:after {
            background: ${props => props.theme.BG_HOVER_ITEM};
        }
    }
`;

const TextColumn = ({ title, description, learnMore }: TextColumnProps) => (
    <Wrapper>
        {title && <Title>{title}</Title>}
        {description && <Description>{description}</Description>}
        {learnMore && (
            <StyledExternalLinkWrapper>
                <StyledExternalLink href={learnMore} size="tiny">
                    <Translation id="TR_LEARN_MORE" />
                </StyledExternalLink>
            </StyledExternalLinkWrapper>
        )}
    </Wrapper>
);

export default TextColumn;
