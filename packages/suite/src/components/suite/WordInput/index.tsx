import React, { useEffect, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { MenuListProps, createFilter } from 'react-select';
import styled, { keyframes } from 'styled-components';
import { Select, variables } from '@trezor/components';
import { BIP_39 } from '@suite-constants';
import { useTranslation } from '@suite-hooks/useTranslation';

const options = BIP_39.map(item => ({ label: item, value: item }));

const shake = keyframes`
    10%, 90% {
        transform: translate3d(-1px, 0, 0);
    }

    20%, 80% {
        transform: translate3d(2px, 0, 0);
    }

    30%, 50%, 70% {
        transform: translate3d(-4px, 0, 0);
    }

    40%, 60% {
        transform: translate3d(4px, 0, 0);
    }
`;

const SelectWrapper = styled.div`
    animation: ${shake} 1.3s;
    margin: 12px auto 0px auto;
    text-align: left;

    width: 380px;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: 280px;
    }
`;

const StyledList = styled(List)`
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
    padding: 8px;
    position: static !important;

    > div {
        position: relative;
    }
`;

type Option = { label: string; value: string };

const MenuList = (props: MenuListProps<Option, boolean>) => {
    const listRef = useRef<List>(null);

    const children = React.Children.toArray(props.children) as React.ReactElement[];

    useEffect(() => {
        if (listRef.current) {
            const currentIndex = children.findIndex(child => child.props.isFocused === true);
            listRef.current.scrollToItem(currentIndex);
        }
    }, [children]);

    return (
        <StyledList
            ref={listRef}
            height={34 * 5 + 8}
            itemCount={children.length}
            itemSize={34}
            width="100%"
        >
            {({ index, style }) => <div style={style}>{children[index]}</div>}
        </StyledList>
    );
};

interface Props {
    onSubmit: (word: string) => void;
}

const WordInput = React.memo((props: Props) => {
    const { onSubmit } = props;
    const { translationString } = useTranslation();

    const MemoSelect = React.memo(() => (
        <Select
            autoFocus
            isSearchable
            isClearable={false}
            controlShouldRenderValue={false}
            noOptionsMessage={({ inputValue }: { inputValue: string }) =>
                translationString('TR_WORD_DOES_NOT_EXIST', { word: inputValue })
            }
            onChange={(item: Option) => onSubmit(item.value)}
            components={{ MenuList }}
            placeholder={translationString('TR_CHECK_YOUR_DEVICE')}
            options={options}
            filterOption={createFilter({
                ignoreCase: true,
                trim: true,
                matchFrom: 'start',
            })}
            data-test="@word-input-select"
        />
    ));

    return (
        <SelectWrapper>
            <MemoSelect />
        </SelectWrapper>
    );
});

export default WordInput;
