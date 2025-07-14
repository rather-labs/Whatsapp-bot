import { type PublicClient, type Chain } from 'viem';
interface NetworkConfig {
    rpc: string;
    chain: Chain;
    name: string;
}
declare const currentNetwork: string;
declare const networkConfig: NetworkConfig;
declare const USDC_CONTRACT_ADDRESS: string;
declare const USDC_ABI: readonly ["function transfer(address to, uint256 amount) returns (bool)", "function balanceOf(address account) view returns (uint256)", "function decimals() view returns (uint8)", "function symbol() view returns (string)"];
declare const VAULT_CONTRACT_ADDRESS: string;
declare const VAULT_ABI: ({
    inputs: {
        internalType: string;
        name: string;
        type: string;
    }[];
    stateMutability: string;
    type: string;
    name?: undefined;
    anonymous?: undefined;
    outputs?: undefined;
} | {
    inputs: {
        internalType: string;
        name: string;
        type: string;
    }[];
    name: string;
    type: string;
    stateMutability?: undefined;
    anonymous?: undefined;
    outputs?: undefined;
} | {
    anonymous: boolean;
    inputs: {
        indexed: boolean;
        internalType: string;
        name: string;
        type: string;
    }[];
    name: string;
    type: string;
    stateMutability?: undefined;
    outputs?: undefined;
} | {
    inputs: {
        internalType: string;
        name: string;
        type: string;
    }[];
    name: string;
    outputs: {
        internalType: string;
        name: string;
        type: string;
    }[];
    stateMutability: string;
    type: string;
    anonymous?: undefined;
})[];
declare let publicClient: PublicClient | undefined;
export { publicClient, networkConfig, USDC_CONTRACT_ADDRESS, USDC_ABI, VAULT_CONTRACT_ADDRESS, VAULT_ABI, currentNetwork };
//# sourceMappingURL=blockchain.d.ts.map