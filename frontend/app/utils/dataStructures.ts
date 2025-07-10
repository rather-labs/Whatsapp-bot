export type PermitMessage = {
    owner: `0x${string}`  , 
    spender: `0x${string}`, 
    value: bigint, 
    nonce: bigint,
    deadline: bigint,
}

export type TransactionMessage = {
    to: `0x${string}`;
    data: `0x${string}`;
}

export type Domain = {
  name: string;
  version: string;
  chainId: bigint;
  verifyingContract: `0x${string}`;
};

export const types = {
    Permit: [
      { name: "owner",    type: "address" },
      { name: "spender",  type: "address" },
      { name: "value",    type: "uint256" },
      { name: "nonce",    type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
    Transaction: [
      { name: "to",       type: "address" },
      { name: "data",     type: "bytes" }
    ]
} as const;

export const domainTypes = {
    EIP712Domain: [
      { name: 'name',              type: 'string'  },
      { name: 'version',           type: 'string'  },
      { name: 'chainId',           type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
  };