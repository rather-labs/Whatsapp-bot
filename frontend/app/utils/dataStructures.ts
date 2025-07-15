export type Message = PermitMessage | TransactionMessage | DepositMessage | WithdrawMessage | TransferMessage | TransferWithinVaultMessage | ChangeRiskProfileMessage | ChangeAuthProfileMessage;

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

export type PaymentData = {
  whatsappNumber: string;
  username: string;
  recipientNumber: string;
  recipientName: string;
  amount: string;
};

export type DepositMessage = {
  user: bigint;
  assets: bigint;
  nonce: bigint;
};

export type DepositData = {
  whatsappNumber: string;
  amount: string;
  signatureRequired: boolean;
};

export type WithdrawMessage = {
  user: bigint;
  assets: bigint;
  nonce: bigint;
};

export type TransferMessage = {
  user: bigint;
  to: `0x${string}`;
  assets: bigint;
  nonce: bigint;
};

export type TransferWithinVaultMessage = {
  userFrom: bigint;
  userTo: bigint;
  assets: bigint;
  nonce: bigint;
};

export type ChangeRiskProfileMessage = {
  user: bigint;
  riskProfile: bigint;
  nonce: bigint;
};

export type ChangeAuthProfileMessage = {
  user: bigint;
  authProfile: bigint;
  nonce: bigint;
};


export const types = {
    Permit: [
      { name: "owner",    type: "address" },
      { name: "spender",  type: "address" },
      { name: "value",    type: "uint256" },
      { name: "nonce",    type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
    deposit: [
      { name: "user",       type: "uint256" },
      { name: "assets",     type: "uint256" },
      { name: "nonce",     type: "uint256" }
    ],
    withdraw: [
      { name: "user",       type: "uint256" },
      { name: "assets",     type: "uint256" },
      { name: "nonce",     type: "uint256" }
    ],
    transfer: [
      { name: "user",       type: "uint256" },
      { name: "to",         type: "address" },
      { name: "assets",     type: "uint256" },
      { name: "nonce",     type: "uint256" }
    ],
    transferWithinVault: [
      { name: "userFrom",       type: "uint256" },
      { name: "userTo",         type: "uint256" },
      { name: "assets",     type: "uint256" },
      { name: "nonce",     type: "uint256" }
    ],
    changeRiskProfile: [
      { name: "user",       type: "uint256" },
      { name: "riskProfile",     type: "uint256" },
      { name: "nonce",     type: "uint256" }
    ],
    changeAuthProfile: [
      { name: "user",       type: "uint256" },
      { name: "authProfile",     type: "uint256" },
      { name: "nonce",     type: "uint256" }
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