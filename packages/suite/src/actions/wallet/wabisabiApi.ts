import TrezorConnect from 'trezor-connect';

// const WABISABI_URL = 'http://127.0.0.1:37127/WabiSabi/'; // CORS
const WABISABI_URL = 'http://127.0.0.1:8081/WabiSabi/'; // proxy

export const enableExperimental = async () => {
    const r = await TrezorConnect.applySettings({
        // @ts-ignore
        experimental_features: true,
    });
    console.warn('Auth', r);
};

export const authorize = async () => {
    // @ts-ignore
    const r = await TrezorConnect.authorizeCoinJoin({
        path: "m/84'/1'/0'",
        max_total_fee: 50000,
        fee_per_anonymity: 200,
        coordinator: 'suite.trezor.io',
        coin_name: 'Regtest',
        // script_type: 'SPENDWITNESS',
    });
    console.warn('Auth', r);
    return r;
};

export const getOwnershipProof = async (utxo: any, roundId: string) => {
    // @ts-ignore
    const r = await TrezorConnect.getOwnershipProof({
        path: utxo.path,
        coin_name: 'Regtest',
        user_confirmation: false,
        // ownership_ids: ['a', 'b'],
        // commitment_data: Buffer.concat([Buffer.from('suite.trezor.io'), Buffer.from(roundId)]),
        commitment_data: Buffer.from(roundId),
    });
    console.warn('getOwnershipProof', r);
    return r;
};

export const getOwnershipId = async () => {
    // @ts-ignore
    const r = await TrezorConnect.getOwnershipId({
        path: "m/84'/1'/0'/0/0",
        coin_name: 'Regtest',
    });
    console.warn('getOwnershipId', r);
};

export const getStatus = () =>
    fetch(`${WABISABI_URL}status`, {
        method: 'GET',
    }).then(r => r.json());

export const connectionConfirmation = () => {
    fetch(`${WABISABI_URL}connection-confirmation`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            roundId: {},
            aliceId: '62749a21-99c3-427f-ad96-9195d057bc89',
            zeroAmountCredentialRequests: {},
            realAmountCredentialRequests: {},
            zeroVsizeCredentialRequests: {},
            realVsizeCredentialRequests: {},
        }),
    })
        .then(r => r.json())
        .then(console.log);
};

export const inputRegistration = (roundId: string, input: string, proof: string) =>
    // ownership_proof: "534c001901016b2055d8190244b2ed2d46513c40658a574d3bc2deb6969c0535bb818b44d2c40002473044022007564201d9d6ac9b689ff6edb25d18084dc6324765aeb4c17d52ef96fd3cbfe70220482f14d5757922180a193fc39af8592d9e0bd28f5372ee5c20a23ef737e4bbee012103505f0d82bbdd251511591b34f36ad5eea37d3220c2b81a1189084431ddb3aa3d"
    // signature: "3044022007564201d9d6ac9b689ff6edb25d18084dc6324765aeb4c17d52ef96fd3cbfe70220482f14d5757922180a193fc39af8592d9e0bd28f5372ee5c20a23ef737e4bbee"
    fetch(`${WABISABI_URL}input-registration`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        // body: JSON.stringify({
        //     roundId: {},
        //     input: {
        //         hash: {},
        //         n: 0,
        //     },
        //     ownershipProof: {
        //         proofBody: {
        //             flags: 1,
        //         },
        //         proofSignature: {
        //             scriptSig: {
        //                 paymentScript: 'string',
        //                 hash: {
        //                     scriptPubKey: 'string',
        //                 },
        //                 witHash: {
        //                     hashForLookUp: {
        //                         scriptPubKey: 'string',
        //                     },
        //                     scriptPubKey: 'string',
        //                 },
        //             },
        //             witness: {},
        //         },
        //     },
        //     zeroAmountCredentialRequests: {},
        //     zeroVsizeCredentialRequests: {},
        // }),
        body: JSON.stringify({
            RoundId: roundId,
            Input: input,
            OwnershipProof: proof,
            ZeroAmountCredentialRequests: {
                Delta: 0,
                Presented: [],
                Requested: [
                    {
                        Ma: '03CBC20176C74ECDE639CDC888E6F1814F046A07F56F2F6E7D1C818C5C4924DC71',
                        BitCommitments: [],
                    },
                    {
                        Ma: '031A2B6AFBA09F4C05B3A1CEE884FB447B9825865D050176664B6EBF47E9C79824',
                        BitCommitments: [],
                    },
                ],
                Proofs: [
                    {
                        PublicNonces: [
                            '03F4226916D021F0A24A878514AFCC13BD5279009D01FAC3B0C1DE548C206293AC',
                        ],
                        Responses: [
                            '40AFD3E83398D63681E854488BF4996FC52106E53F04C5C7A47ACC31A67B5FD1',
                        ],
                    },
                    {
                        PublicNonces: [
                            '0304D2C7C8B4F83BB21718FE7DE6BB8AFF75BBDFEB9E2B466CC3F7A1E3414457A4',
                        ],
                        Responses: [
                            'B7E332ACBE6AC302E00D569EF83B55543E7D5D3307AAEB41B9DBAE8FF2B85DF2',
                        ],
                    },
                ],
            },
            ZeroVsizeCredentialRequests: {
                Delta: 0,
                Presented: [],
                Requested: [
                    {
                        Ma: '03A8AEF039EF559404FA218A108284321F1648B6FF4EBAEDE37BB58F53E2CC8827',
                        BitCommitments: [],
                    },
                    {
                        Ma: '03E638D186F949125AB6895398347004E652402B987B65BE5399E847917CF5E144',
                        BitCommitments: [],
                    },
                ],
                Proofs: [
                    {
                        PublicNonces: [
                            '03FCD358954D624AF7FF58E283EDD0AACBF6043F19F7F661749C0509B72E944E8A',
                        ],
                        Responses: [
                            '293B8AD9CC22A0ACCE8E698CB29A94B28DC241D5CA84B2D90A7EFAC3C4DA25A7',
                        ],
                    },
                    {
                        PublicNonces: [
                            '03BEAC5810370AAD67C540D45319CBF197C218EEFC07A8E6D1A7497AFE78A5793E',
                        ],
                        Responses: [
                            '940C4A26705C92FF0CBDBF10F064CD0209E2028F1EE07C8684694D11DF697EA7',
                        ],
                    },
                ],
            },
        }),
    }).then(r => r.json());

export const outputRegistration = () => {
    fetch(`${WABISABI_URL}output-registration`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            roundId: {},
            script: {
                paymentScript: 'string',
                hash: {
                    scriptPubKey: 'string',
                },
                witHash: {
                    hashForLookUp: {
                        scriptPubKey: 'string',
                    },
                    scriptPubKey: 'string',
                },
            },
            amountCredentialRequests: {},
            vsizeCredentialRequests: {},
        }),
    })
        .then(r => r.json())
        .then(console.log);
};

export const credentialIssuance = () => {
    fetch(`${WABISABI_URL}credential-issuance`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            roundId: {},
            realAmountCredentialRequests: {},
            realVsizeCredentialRequests: {},
            zeroAmountCredentialRequests: {},
            zeroVsizeCredentialsRequests: {},
        }),
    })
        .then(r => r.json())
        .then(console.log);
};

export const inputUnregistration = () => {
    fetch(`${WABISABI_URL}input-unregistration`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            roundId: {},
            aliceId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        }),
    })
        .then(r => r.json())
        .then(console.log);
};

export const transactionSignature = () => {
    fetch(`${WABISABI_URL}transaction-signature`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            roundId: {},
            inputWitnessPairs: [
                {
                    inputIndex: 0,
                    witness: {},
                },
            ],
        }),
    })
        .then(r => r.json())
        .then(console.log);
};

export const readyToSign = () => {
    fetch(`${WABISABI_URL}ready-to-sign`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            roundId: {},
            aliceId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        }),
    })
        .then(r => r.json())
        .then(console.log);
};
