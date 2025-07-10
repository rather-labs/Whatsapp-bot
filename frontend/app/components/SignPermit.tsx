"use client";
import { useEffect, useState } from 'react';
import { concatBytes, decodeAbiParameters, type Hex, isHex, keccak256, maxUint256, parseSignature, slice, toBytes, toHex } from 'viem';
import { parseErc6492Signature, isErc6492Signature } from 'viem/utils'; //not ERC-6492 aware
import { type LifecycleStatus, Signature } from '@coinbase/onchainkit/signature';
import { usePublicClient, useAccount, useWalletClient, useSwitchChain  } from 'wagmi';
import { useSignature } from '../context/SignatureContext';
import { type PermitMessage as Message, type Domain, types } from '../utils/dataStructures';
import type { APIError } from '@coinbase/onchainkit/api';


export default function SignPermit() {

  const { setSignature, setIsSignatureValid, disabled, setDisabled } = useSignature();
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();

  const userAddress = address as `0x${string}`;
  const vaultAddress = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as `0x${string}`
  const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`

  const client = usePublicClient();
  const { switchChain } = useSwitchChain();
  
  const [message, setMessage] = useState<Message|undefined>();
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
        
        const messageData = {
          owner: userAddress, 
          spender: vaultAddress, 
          value: maxUint256, // Set no value limit
          nonce: nonce,
          deadline: maxUint256, // Set no timelimit
        };
        console.log('messageData', messageData);
        
        setMessage(messageData);

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

        const version = await client.readContract({
          address: tokenAddress,
          abi: [{ 
            name: "version", 
            type: "function", 
            stateMutability: "view",
            inputs: [],
            outputs: [{ type: 'string' }],
            }],
          functionName: "version",
        });

        setDomain({
          name,
          version,
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
      primaryType: 'Permit',
      message: message as Message,
      types
    }); 
    console.log('newSignature validation result:', isNewSignatureValid);
    setIsSignatureValid(isNewSignatureValid);
    let signature = newSignature as `0x${string}`;
    while (isErc6492Signature(signature)) {
      //signature = unwrap6492Signature(signature as `0x${string}`).ownerSignature as `0x${string}`;
      //signature = unwrapErc6492Signature(signature as `0x${string}`).ownerSignature as `0x${string}`;
      signature = parseErc6492Signature(signature as `0x${string}`).signature;
      console.log('signature', signature);
      console.log('signature length', signature.length);
    }

    // CANT USER PERMIT: passkey smart wallets don't have (r,s,v) signature, 
    //  usdc doesn't  support a P-256 signature. 
    const { r, s, v } = parseSignature(signature as `0x${string}`);
    console.log('v', v);
    console.log('r', r);
    console.log('s', s);
    const tx = await walletClient?.writeContract({
      address: tokenAddress,                          
      abi: [
        {
          constant: true,
          inputs: [
            { name: 'hash', type: 'bytes32' },
            { name: 'signature', type: 'bytes' },
          ],
          name: 'isValidSignature',
          outputs: [{ name: 'magicValue', type: 'bytes4' }],
          payable: false,
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: "isValidSignature",
      args: [
        keccak256(toBytes(message as Message)),      // signer address
        signature,     // contract that will pull tokens
        userAddress,
      ],
    })
    console.log('tx', tx);
    if (tx) {
      await client.waitForTransactionReceipt({ hash: tx });
    }
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
          primaryType="Permit"
          message={message}
          label="Sign token permit"
          onSuccess={handleSignatureSuccess}
          onStatus={handleStatusChange}
          onError={handleError}
          disabled={disabled || !domain}
        />
      )}
    </div>
  );
} 