import React from 'react';

import { GetAddress } from './views';

interface Props {
    message: string;
}

const Main: React.FC<Props> = props => {
    const { message } = props;

    switch (message) {
        case 'GetAddress':
            return <GetAddress {...message} />;
        default:
            return <div>Unexpected message</div>;
    }
};

export default <Main />;
