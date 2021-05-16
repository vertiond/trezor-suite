export default {
    blockbook: [
        {
            description: 'Not supported',
            params: 'A',
            serverFixtures: [
                {
                    method: 'getAccountUtxo',
                    response: {
                        data: { error: { message: 'Not supported' } },
                    },
                },
            ],
            error: 'Not supported',
        },
        {
            description: 'empty account',
            params: {
                descriptor: 'A',
            },
            response: [],
        },
        {
            description: 'Testnet account with 1 utxo',
            params:
                'upub5Df5hVPH2yM4Khs85P8nkq3x9GRcvX3FgDitXDcqSJDXgMJjVmpWPRqwqHExjQcezkjDDyU1u3ij1wUPXHaYqRHehuGtBvSPzcocpKu3wUz',
            serverFixtures: [
                {
                    method: 'getAccountUtxo',
                    response: {
                        data: [
                            {
                                address: '2N1VPCeEUXFdZepHJgbzSZgoi6nGrGFgeRH',
                                confirmations: 116338,
                                height: 1450749,
                                path: "m/49'/1'/0'/1/0",
                                txid:
                                    'ee7720c3350ff500b8b6a3a477fb71ef35e37c18f1929a586324791e6c5a11dd',
                                value: '18833',
                                vout: 1,
                            },
                        ],
                    },
                },
            ],
            response: [
                {
                    txid: 'ee7720c3350ff500b8b6a3a477fb71ef35e37c18f1929a586324791e6c5a11dd',
                    vout: 1,
                    amount: '18833',
                    blockHeight: 1450749,
                    address: '2N1VPCeEUXFdZepHJgbzSZgoi6nGrGFgeRH',
                    path: "m/49'/1'/0'/1/0",
                    confirmations: 116338,
                },
            ],
        },
        {
            description: 'Testnet account with undefined amount',
            params:
                'upub5Df5hVPH2yM4Khs85P8nkq3x9GRcvX3FgDitXDcqSJDXgMJjVmpWPRqwqHExjQcezkjDDyU1u3ij1wUPXHaYqRHehuGtBvSPzcocpKu3wUz',
            serverFixtures: [
                {
                    method: 'getAccountUtxo',
                    response: {
                        data: [
                            {
                                address: '2N1VPCeEUXFdZepHJgbzSZgoi6nGrGFgeRH',
                                confirmations: 116338,
                                height: 1450749,
                                path: "m/49'/1'/0'/1/0",
                                txid:
                                    'ee7720c3350ff500b8b6a3a477fb71ef35e37c18f1929a586324791e6c5a11dd',
                                value: undefined,
                                vout: 1,
                            },
                        ],
                    },
                },
            ],
            response: [
                {
                    txid: 'ee7720c3350ff500b8b6a3a477fb71ef35e37c18f1929a586324791e6c5a11dd',
                    vout: 1,
                    blockHeight: 1450749,
                    address: '2N1VPCeEUXFdZepHJgbzSZgoi6nGrGFgeRH',
                    path: "m/49'/1'/0'/1/0",
                    confirmations: 116338,
                },
            ],
        },
    ],
    ripple: [
        {
            description: 'getAccountUtxo - not implemented',
            params: 'A',
            error: 'Unknown message type: m_get_account_utxo',
        },
    ],
    cardano: [
        {
            description: 'Many utxos',
            params:
                'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
            serverFixtures: [
                {
                    method: 'GET_ACCOUNT_UTXO',
                    response: {
                        data: [
                            {
                                address:
                                    'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                                utxoData: {
                                    tx_hash:
                                        '96a4ed36f2f117ba0096b7f3c8f28b6dbca0846cbb15662f90fa7b0b08fc7529',
                                    tx_index: 0,
                                    output_index: 0,
                                    amount: [
                                        {
                                            unit: 'lovelace',
                                            quantity: '1518517',
                                        },
                                        {
                                            unit:
                                                '2f712364ec46f0cf707d412106ce71ef3370f76e27fb56b6bb14708776657465726e696b4e657a6a6564656e79',
                                            quantity: '1',
                                        },
                                    ],
                                    block:
                                        '0eed37582508f89e98bc148a3be79856a6e03a98a8e9d206634797d49655da05',
                                },
                                blockInfo: {
                                    time: 1617638687,
                                    height: 5553000,
                                    hash:
                                        '0eed37582508f89e98bc148a3be79856a6e03a98a8e9d206634797d49655da05',
                                    slot: 26072396,
                                    epoch: 257,
                                    epoch_slot: 411596,
                                    slot_leader:
                                        'pool16kus5xvdysgmtjp0hhlwt72tsm0yn2zcn0a8wg9emc6c75lxvmc',
                                    size: 25948,
                                    tx_count: 37,
                                    output: '10098502831419',
                                    fees: '7777002',
                                    block_vrf:
                                        'vrf_vk1rrf0qyyv45pu7talhcdfzk4hc0273k54504vdralnu9tyul4xspqk7d35p',
                                    previous_block:
                                        '6778382568d10c6cd65782f0dcdf708c922363d7de199b84479288a09a5a4dd3',
                                    next_block:
                                        'cad86f7b8bb041c8028186504248358c08dfde96a5a1047106d819b68ef54785',
                                    confirmations: 172682,
                                },
                            },
                            {
                                address:
                                    'addr1q99hnk2vnx708l86mujpfs9end50em9s95grhe3v4933m259ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usr7qlze',
                                utxoData: {
                                    tx_hash:
                                        'd9a8ae2194e2e25e8079a04a4694e2679464a4f51512863a0008a35a85762ff0',
                                    tx_index: 1,
                                    output_index: 1,
                                    amount: [
                                        {
                                            unit: 'lovelace',
                                            quantity: '35347470',
                                        },
                                    ],
                                    block:
                                        'f1085bc718c5514e8f08354af8822b528c6eee5855d0f87ba5f4ede0f73a6067',
                                },
                                blockInfo: {
                                    time: 1614600060,
                                    height: 5405008,
                                    hash:
                                        'f1085bc718c5514e8f08354af8822b528c6eee5855d0f87ba5f4ede0f73a6067',
                                    slot: 23033769,
                                    epoch: 250,
                                    epoch_slot: 396969,
                                    slot_leader:
                                        'pool15zrkyr0f80hxlt4scv72tej8l8zwrcphmrega9wutqchjekceal',
                                    size: 5489,
                                    tx_count: 10,
                                    output: '877185047625',
                                    fees: '1871739',
                                    block_vrf:
                                        'vrf_vk1973re7lsj6va8q8ly4tpedu9hr9mc28wehfwvhqszd3u48kndatszu3d8w',
                                    previous_block:
                                        '45c1b9457d0bb56d4cfcba1ca43c4686a9036d36a53a76da424c535f881b570d',
                                    next_block:
                                        '4154b60f8fff61f096615f94268194d0bd34d9e8d5832290b557937f3ecfb7b6',
                                    confirmations: 320674,
                                },
                            },
                        ],
                    },
                },
            ],
            response: [
                {
                    address:
                        'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                    txid: '96a4ed36f2f117ba0096b7f3c8f28b6dbca0846cbb15662f90fa7b0b08fc7529',
                    confirmations: 172682,
                    blockHeight: 5553000,
                    amount: '1518517',
                    vout: -1,
                    path: '-1',
                },
                {
                    address:
                        'addr1q99hnk2vnx708l86mujpfs9end50em9s95grhe3v4933m259ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usr7qlze',
                    txid: 'd9a8ae2194e2e25e8079a04a4694e2679464a4f51512863a0008a35a85762ff0',
                    confirmations: 320674,
                    blockHeight: 5405008,
                    amount: '35347470',
                    vout: -1,
                    path: '-1',
                },
            ],
        },
    ],
};
