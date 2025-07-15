"use client";
import { Buy } from '@coinbase/onchainkit/buy'; 
import type { Token } from '@coinbase/onchainkit/token';
import { useEffect } from 'react';
import { useAccount, useSwitchChain, useWalletClient } from 'wagmi';


export default function BuyTokens() { 
  const { chainId } = useAccount();
  const { data: walletClient } = useWalletClient();

  const { switchChain } = useSwitchChain();
    
  useEffect(() => { // without this, the signature is failing for testnet and localhost
    if (walletClient?.chain.id !== chainId) {
      switchChain({ chainId: walletClient?.chain.id as 31337 | 84532 | 8453 });
    }
  }, [walletClient?.chain.id, chainId, switchChain]);
   
  const usdcToken: Token = {
    name: 'USDC',
    address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Base Sepolia
    //address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base mainnet 
    symbol: 'USDC',
    decimals: 18,
    image: 'usdc-icon.svg',
    chainId: chainId,
  };

  return ( 
    <Buy toToken={usdcToken} isSponsored />
  ) 
}
