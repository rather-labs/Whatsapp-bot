"use client";
import { useEffect, useState } from 'react';
import { maxUint256 } from 'viem';
import { type LifecycleStatus, Signature } from '@coinbase/onchainkit/signature';
import { usePublicClient, useAccount } from 'wagmi';
import { useSignature } from '../context/SignatureContext';

export default function SignPermit() {
  const { signature, setSignature, setIsSignatureValid, disabled, setDisabled } = useSignature();
  const { address } = useAccount();
  const [nonce, setNonce] = useState<number>(0);

  const userAddress = address as `0x${string}`;
  const vaultAddress = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as `0x${string}`
  const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`

  const client = usePublicClient();

  console.log('address', address);
  console.log('client.chain.id', client.chain.id);
  const domain = {
    name: 'USD Coin',
    version: '2',
    chainId: client.chain.id,
    verifyingContract: tokenAddress,
  };
  
  const types  = { 
    Permit: [
      { name: 'owner',    type: 'address' },
      { name: 'spender',  type: 'address' },
      { name: 'value',    type: 'uint256' },
      { name: 'nonce',    type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ]
  }
  
  const message = { 
    owner: userAddress, 
    spender: vaultAddress, 
    value: maxUint256, 
    nonce,
    deadline: maxUint256,
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: Message rerenders and should not be used
  useEffect(() => {
    if (signature && client && message) {
      const verifySignature = async () => {
        try {
          const isValid = await client.verifyTypedData({
            address: userAddress,
            signature: signature as `0x${string}`,
            primaryType: 'Permit',
            message,
            types,
          }); 
          console.log('Signature validation result:', isValid);
          setIsSignatureValid(isValid);
        } catch (error) {
          console.error('Error verifying signature:', error);
          setIsSignatureValid(false);
        }
      };
      verifySignature();
    }
  }, [signature, client, setIsSignatureValid]);

  useEffect(() => {
    const getNonce = async () => {
      if (!client) return;
      // Get nonce from Token address
      const nonce = await client.readContract({
        address: tokenAddress,
        abi: [{ 
          name: "nonces", 
          type: "function", 
          stateMutability: "view",
          inputs: [{ type: "address" }], 
          outputs: [{ type: "uint256" }] 
          }],
        functionName: "nonces",
        args: [userAddress],
      });
      setNonce(Number(nonce));
      console.log('nonce', nonce);
    }
    getNonce();
  }, [client, tokenAddress, userAddress]);

  const handleSignatureSuccess = (newSignature: string) => {
    setSignature(newSignature);
  };

  const handleStatusChange = (newStatus: LifecycleStatus) => {
    setDisabled(newStatus.statusName === 'success');
  };

  return (
    <div className="w-full">
      <Signature
        domain={domain}
        types={types}
        primaryType="Permit"
        message={"Sign permit to allow the service to manage assets"}
        label="Sign token permit"
        onSuccess={handleSignatureSuccess}
        onStatus={handleStatusChange}
        className="custom-class"
        disabled={disabled}
      />
    </div>
  );
} 