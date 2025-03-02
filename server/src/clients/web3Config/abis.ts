// abis.ts
export const POAP_CONTRACT_ADDRESS = '0xf2bb496b045df0f787Ecd8A84c6890b6d2a3CFa7';
export const RPC_URL = 'https://base-sepolia-rpc.publicnode.com';
export const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

export const POAP_ABI = [
    // Constructor
    {
        'inputs': [],
        'stateMutability': 'nonpayable',
        'type': 'constructor',
    },

    // Session Management Functions
    {
        'inputs': [
            {
                'internalType': 'string',
                'name': 'sessionName',
                'type': 'string',
            },
            {
                'internalType': 'string',
                'name': 'tokenURI_',
                'type': 'string',
            },
            {
                'internalType': 'uint256',
                'name': 'sessionId',
                'type': 'uint256',
            },
        ],
        'name': 'createSession',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function',
    },
    {
        'inputs': [
            {
                'internalType': 'address[]',
                'name': 'recipients',
                'type': 'address[]',
            },
            {
                'internalType': 'uint256',
                'name': 'sessionId',
                'type': 'uint256',
            },
        ],
        'name': 'batchMintTokens',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function',
    },

    // Session Query Functions
    {
        'inputs': [
            {
                'internalType': 'uint256',
                'name': 'sessionId',
                'type': 'uint256',
            },
        ],
        'name': 'getSessionDetails',
        'outputs': [
            {
                'internalType': 'string',
                'name': 'name',
                'type': 'string',
            },
            {
                'internalType': 'string',
                'name': 'tokenURI_',
                'type': 'string',
            },
            {
                'internalType': 'bool',
                'name': 'exists',
                'type': 'bool',
            },
        ],
        'stateMutability': 'view',
        'type': 'function',
    },
    {
        'inputs': [
            {
                'internalType': 'uint256',
                'name': 'sessionId',
                'type': 'uint256',
            },
            {
                'internalType': 'address',
                'name': 'recipient',
                'type': 'address',
            },
        ],
        'name': 'hasReceivedTokenForSession',
        'outputs': [
            {
                'internalType': 'bool',
                'name': '',
                'type': 'bool',
            },
        ],
        'stateMutability': 'view',
        'type': 'function',
    },

    // Token Management Functions
    {
        'inputs': [
            {
                'internalType': 'address',
                'name': 'to',
                'type': 'address',
            },
            {
                'internalType': 'string',
                'name': 'uri',
                'type': 'string',
            },
        ],
        'name': 'safeMint',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function',
    },
    {
        'inputs': [
            {
                'internalType': 'uint256',
                'name': 'tokenId',
                'type': 'uint256',
            },
        ],
        'name': 'burn',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function',
    },
    {
        'inputs': [
            {
                'internalType': 'uint256',
                'name': 'tokenId',
                'type': 'uint256',
            },
        ],
        'name': 'revoke',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function',
    },

    // Events
    {
        'anonymous': false,
        'inputs': [
            {
                'indexed': true,
                'internalType': 'uint256',
                'name': 'sessionId',
                'type': 'uint256',
            },
            {
                'indexed': false,
                'internalType': 'string',
                'name': 'name',
                'type': 'string',
            },
        ],
        'name': 'SessionCreated',
        'type': 'event',
    },
    {
        'anonymous': false,
        'inputs': [
            {
                'indexed': true,
                'internalType': 'uint256',
                'name': 'sessionId',
                'type': 'uint256',
            },
            {
                'indexed': false,
                'internalType': 'uint256',
                'name': 'count',
                'type': 'uint256',
            },
        ],
        'name': 'BatchMinted',
        'type': 'event',
    },
    {
        'anonymous': false,
        'inputs': [
            {
                'indexed': true,
                'internalType': 'address',
                'name': 'to',
                'type': 'address',
            },
            {
                'indexed': true,
                'internalType': 'uint256',
                'name': 'tokenId',
                'type': 'uint256',
            },
        ],
        'name': 'Attest',
        'type': 'event',
    },
    {
        'anonymous': false,
        'inputs': [
            {
                'indexed': true,
                'internalType': 'address',
                'name': 'to',
                'type': 'address',
            },
            {
                'indexed': true,
                'internalType': 'uint256',
                'name': 'tokenId',
                'type': 'uint256',
            },
        ],
        'name': 'Revoke',
        'type': 'event',
    },
] as const;