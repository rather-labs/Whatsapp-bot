"use client";

import { Wallet } from '@coinbase/onchainkit/wallet';
import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from 'wagmi';
import type { Token } from '@coinbase/onchainkit/token';
import { Buy } from '@coinbase/onchainkit/buy';
import { FundButton } from '@coinbase/onchainkit/fund';

export default function Home() {

  const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`

  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [onRampSuccess, setOnRampSuccess] = useState(false); 

  const client = usePublicClient();

  const { switchChain } = useSwitchChain();
   
  const [tokenInfo, setTokenInfo] = useState<Token>({
    name: 'USD Coin',
    address: tokenAddress,
    symbol: 'USDC',
    decimals: 6,
    image: '../usdc-icon.svg',
    chainId: chainId as number,
  });

  useEffect(() => { // without this, the signature is failing for testnet and localhost
    if (walletClient?.chain.id !== chainId) {
      switchChain({ chainId: walletClient?.chain.id as 31337 | 84532 | 8453 });
    }
  }, [walletClient?.chain.id, chainId, switchChain]);

  useEffect(() => { // get token info
    const getInfo = async () => {
      if (!client) return;
      
      try {
        const name = await client.readContract({
          address: tokenAddress,
          abi: [{ 
            name: "name", 
            type: "function", 
            stateMutability: "view",
            inputs: [],
            outputs: [{ type: 'string' }],
            }],
          functionName: "name",
        });

        const symbol = await client.readContract({
          address: tokenAddress,
          abi: [{ 
            name: "symbol", 
            type: "function", 
            stateMutability: "view",
            inputs: [],
            outputs: [{ type: 'string' }],
            }],
          functionName: "symbol",
        });

        const decimals = await client.readContract({
          address: tokenAddress,
          abi: [{ 
            name: "decimals", 
            type: "function", 
            stateMutability: "view",
            inputs: [],
            outputs: [{ type: 'uint8' }],
            }],
          functionName: "decimals",
        });

        setTokenInfo({
          name,
          address: tokenAddress,
          symbol,
          decimals,
          image: tokenInfo.image,
          chainId: chainId as number,
        });

      } catch (error) {
        console.error('Error fetching token information:', error);
      }
    }
    getInfo();
  }, [client, tokenAddress, chainId, tokenInfo.image]);

  return (
    <main className="flex flex-col items-center justify-center mt-8">        
      <div className="w-full flex justify-center z-50">
        <Wallet />
      </div>
      { address && ( // TODO: keep one of these once on-ramp is available
        // TODO: remove "|| true" once on-ramp is available
        <div className="w-full flex justify-center mt-6">
          <Buy toToken={tokenInfo} isSponsored 
          disabled={onRampSuccess || true} 
          onSuccess={() => {
            setOnRampSuccess(true);
          }}
          />
        </div>
      )}
      { address && ( // TODO: remove "|| true" once on-ramp is available
        <div className="w-full flex justify-center mt-6">
          <FundButton disabled={onRampSuccess || true} /> 
        </div>
      )}
      { address && ( // TODO: remove once on-ramp is available
        <div className="w-full flex justify-center mt-6">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md text-center max-w-xl">
            <strong className="block mb-1">On-Ramp Unavailable</strong>
            <span>
              On-ramp services are <span className="font-semibold">not available</span> in this Proof of Concept.<br />
              You must have sufficient funds in your wallet to send tokens to the vault.
            </span>
          </div>
        </div>
      )}
      { onRampSuccess && (
        <div className="w-full flex justify-center mt-6">
          <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 rounded-md text-center max-w-xl">
            <strong className="block mb-1">On-Ramp Finished. Close this window.</strong>
          </div>
        </div>
      )}
    </main>
  );
}