import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { Translation, ExternalLink } from '@suite-components';
import HoverAnimation from '@suite-views/hover-animation';

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
    padding-right: 0;
    margin-left: -4px;
`;

const StyledExternalLinkWrapper = styled.div`
    display: flex;
    &:hover ${StyledExternalLink} {
        text-decoration: none;
    }
`;

const TextColumn = ({ title, description, learnMore }: TextColumnProps) => (
    <Wrapper>
        {title && <Title>{title}</Title>}
        {description && <Description>{description}</Description>}
        {learnMore && (
            <StyledExternalLinkWrapper>
                <HoverAnimation>
                    <StyledExternalLink href={learnMore} size="tiny">
                        <Translation id="TR_LEARN_MORE" />
                    </StyledExternalLink>
                </HoverAnimation>
            </StyledExternalLinkWrapper>
        )}
    </Wrapper>
);

export default TextColumn;
