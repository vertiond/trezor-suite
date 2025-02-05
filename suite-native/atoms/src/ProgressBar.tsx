import React from 'react';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from './Box';

type ProgressBarProps = {
    value: number; // Percentage value
    color: string;
};

const PROGRESS_BAR_WIDTH = 82;
const progressBarStyle = prepareNativeStyle(utils => ({
    height: 3,
    width: PROGRESS_BAR_WIDTH,
    backgroundColor: utils.colors.gray200,
}));

const progressFillStyle = prepareNativeStyle<{ width: number; color: string }>(
    (_, { width, color }) => ({
        width: (width / 100) * PROGRESS_BAR_WIDTH,
        height: 3,
        backgroundColor: color,
    }),
);

export const ProgressBar = ({ value, color }: ProgressBarProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(progressBarStyle)}>
            <Box style={applyStyle(progressFillStyle, { width: value, color })} />
        </Box>
    );
};
