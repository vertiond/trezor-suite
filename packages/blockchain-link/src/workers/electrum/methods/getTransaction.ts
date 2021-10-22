import { Api, getTransactions } from '../utils';
import type { GetTransaction as Req } from '../../../types/messages';
import type { GetTransaction as Res } from '../../../types/responses';

const getTransaction: Api<Req, Res> = async (client, payload) => {
    const [tx] = await getTransactions(client, [payload]);
    return {
        type: 'blockbook',
        tx,
    };
};

export default getTransaction;
