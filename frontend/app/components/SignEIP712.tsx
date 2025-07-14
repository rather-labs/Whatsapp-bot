"use client";
import { useEffect, useState } from 'react';
import { decodeAbiParameters, encodeFunctionData, type Hex, http, isHex, maxUint256, parseSignature, slice, toHex } from 'viem';
import { erc20Abi, erc4337Abi } from 'viem';
import { abi } from 'viem/account-abstraction';
import { type LifecycleStatus, Signature } from '@coinbase/onchainkit/signature';
import { usePublicClient, useAccount, useWalletClient, useSwitchChain, useConfig  } from 'wagmi';
import { useSignature } from '../context/SignatureContext';
import { type TransactionMessage, type Domain, types } from '../utils/dataStructures';
import type { APIError } from '@coinbase/onchainkit/api';
import { bundlerActions, createBundlerClient } from 'viem/account-abstraction';
import { baseSepolia } from 'viem/chains';

export default function SignEIP712() {

  const { setSignature, setIsSignatureValid, disabled, setDisabled, setMessage, message } = useSignature();
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();

  const userAddress = address as `0x${string}`;
  const vaultAddress = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as `0x${string}`
  const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`

  const client = usePublicClient();

  const { switchChain } = useSwitchChain();
  
  const [domain, setDomain] = useState<Domain|undefined>();
 
  useEffect(() => { // without this, the signature is failing for testnet and localhost
    if (walletClient?.chain.id !== chainId) {
      switchChain({ chainId: walletClient?.chain.id as 31337 | 84532 | 8453 });
    }
  }, [walletClient?.chain.id, chainId, switchChain]); 

  useEffect(() => {
    const getNonce = async () => {
      if (!client || !userAddress) return;
      
      try {
        // Get nonce from Token address
        const approveCalldata = encodeFunctionData({
          abi: erc20Abi,
          functionName: "approve",
          args: [vaultAddress, maxUint256],
        });
        
        const messageData = {
          to: tokenAddress, 
          data: approveCalldata, 
        };
        console.log('messageData', messageData);
        
        setMessage(messageData);

        setDomain({
          name: 'SmartWallet',
          version: '1',
          chainId: BigInt(client?.chain.id),
          verifyingContract: tokenAddress,
        });

      } catch (error) {
        console.error('Error fetching nonce:', error);
      }
    }
    getNonce();
  }, [client, tokenAddress, userAddress, vaultAddress]);

  const handleSignatureSuccess = async (newSignature: string) => {
  
    setSignature(newSignature as `0x${string}`);

    const isNewSignatureValid = await client.verifyTypedData({ //ERC-6492 aware
      address: userAddress,
      signature: newSignature as `0x${string}`,
      domain,
      primaryType: 'Transaction',
      message: message as TransactionMessage,
      types
    }); 
    setIsSignatureValid(isNewSignatureValid);

  };

  const handleStatusChange = (newStatus: LifecycleStatus) => {
    setDisabled(newStatus.statusName === 'success');
  };

  const handleError = async (error: APIError) => {
    console.error('Error:', error);
  };

  if (!tokenAddress || !vaultAddress) {
    return (
      <div className="w-full p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <p>Error: Missing environment variables</p>
        <p>Please set NEXT_PUBLIC_TOKEN_ADDRESS and NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS in your .env.local file</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {message && (
        <Signature
          domain={domain}
          types={types}
          primaryType="Transaction"
          message={message}
          label="Sign transaction"
          onSuccess={handleSignatureSuccess}
          onStatus={handleStatusChange}
          onError={handleError}
          disabled={disabled || !domain}
        />
      )}
    </div>
  );
} 