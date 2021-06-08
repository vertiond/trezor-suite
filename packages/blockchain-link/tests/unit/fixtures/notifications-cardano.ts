// To avoid unnecessary data this fixtures sends notifications with mostly undefined values
const tx = {
    tokens: [],
    targets: [],
};

const notifyBlocks = [
    {
        description: 'single block notification',
        method: 'subscribe',
        notifications: [
            {
                id: '0',
                data: { hash: 'abcd', height: 1 },
            },
        ],
        result: {
            blockHash: 'abcd',
            blockHeight: 1,
        },
    },
    {
        description: 'server send notifications after unsubscribe',
        method: 'unsubscribe',
        notifications: [
            {
                id: '1',
                data: { hash: 'abcd', height: 1 },
            },
            {
                id: '1',
                delay: 100,
                data: { hash: 'efgh', height: 2 },
            },
        ],
        result: undefined,
    },
];

const notifyAddresses = [
    {
        description: 'address tx notification (sent)',
        method: 'subscribe',
        params: {
            type: 'addresses',
            addresses: ['A'],
        },
        notifications: {
            data: {
                address: 'A',
                tx: {
                    vin: [{ addresses: ['A'] }],
                    vout: [{ addresses: ['B'] }],
                },
            },
        },
        result: {
            descriptor: 'A',
            tx: {
                ...tx,
                amount: '0',
                totalSpent: '0',
                type: 'sent',
                targets: [{ addresses: ['B'], n: 0 }],
                details: {
                    vin: [{ addresses: ['A'] }],
                    vout: [{ addresses: ['B'] }],
                    size: 0,
                    totalInput: '0',
                    totalOutput: '0',
                },
            },
        },
    },
];

export default {
    notifyBlocks,
    notifyAddresses,
} as const;
