"use client";
import { useEffect, useState } from 'react';
import { smartw, decodeAbiParameters, type Hex, isHex, maxUint256, parseSignature, slice, toHex } from 'viem';
import { parseErc6492Signature, isErc6492Signature } from 'viem/utils'; //not ERC-6492 aware
import { type LifecycleStatus, Signature } from '@coinbase/onchainkit/signature';
import { usePublicClient, useAccount, useWalletClient, useSwitchChain  } from 'wagmi';
import { useSignature } from '../context/SignatureContext';
import { type Message, type Domain, permitTypes } from '../utils/dataStructures';
import type { APIError } from '@coinbase/onchainkit/api';

type UnwrappedSignature = {
  ownerSignature: Hex;
  factory: Hex;
  factoryCalldata: Hex;
};

const ERC6492_MAGIC_SUFFIX = '0x6492649264926492649264926492649264926492649264926492649264926492';

export function unwrap6492Signature(wrappedSig: string) : UnwrappedSignature {
  console.log('wrappedSig', wrappedSig);
  // Remove the magic suffix (last 32 bytes) from the wrappedSig
  const wrappedSigWithoutMagic = slice(wrappedSig as `0x${string}`, 0, -32);
  const dataLength = wrappedSigWithoutMagic.length - 130 - 40 - 2;
  console.log('dataLength', dataLength);
  const [factory, factoryCalldata, ownerSignature] = decodeAbiParameters(
    // The last parameter is the owner's signature, which is always 65 bytes in length
    [{ type: 'address' }, { type: `bytes${dataLength/2}` }, { type: 'bytes65' }],
    wrappedSig as `0x${string}`,
  )
  return {
    factory,
    factoryCalldata: factoryCalldata as `0x${string}`,
    ownerSignature: ownerSignature as `0x${string}`,
  }
}

export function unwrapErc6492Signature(wrappedSignature: Hex): UnwrappedSignature {
  // 1. Validate the input to ensure it's a hex string
  if (!isHex(wrappedSignature)) {
    throw new Error('Input must be a valid hex string.');
  }

  // 2. Check if the signature ends with the ERC-6492 magic suffix
  if (!wrappedSignature.endsWith(ERC6492_MAGIC_SUFFIX.slice(2))) { // slice '0x' from suffix for string comparison
    console.log("Not an ERC-6492 signature: Magic suffix is missing.");
    throw new Error('Not an ERC-6492 signature: Magic suffix is missing.');
  }

  // 3. If it's a valid ERC-6492 signature, parse its components.
  // The structure is: [factory (20 bytes)][factoryCalldata (variable)][ownerSignature (65 bytes)][magicSuffix (32 bytes)]
  
  // Remove the magic suffix to work with the core data
  const coreData = slice(wrappedSignature, 0, -32); // Remove last 32 bytes (suffix)
  console.log('wrappedSignature', wrappedSignature);
  console.log('coreData', coreData);

  // Extract the owner's signature (last 65 bytes of the core data)
  const ownerSignature = slice(coreData, -65);

  // Extract the factory address (first 20 bytes of the core data)
  const factory = slice(coreData, 0, 20);

  // The remaining data between the factory and the owner signature is the factoryCalldata
  const factoryCalldata = slice(coreData, 20, -65);

  return {
    ownerSignature,
    factory,
    factoryCalldata,
  };
}

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

  const types = permitTypes;
  
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

    const { r, s, v } = parseSignature(signature as `0x${string}`);
    console.log('v', v);
    console.log('r', r);
    console.log('s', s);
    const tx = await walletClient?.writeContract({
      address: tokenAddress,                          
      abi: [
        {
          name:   "permit",           // ERC-2612
          type:   "function",
          inputs: [
            { name: "owner",    type: "address" },
            { name: "spender",  type: "address" },
            { name: "value",    type: "uint256" },
            { name: "deadline", type: "uint256" },
            { name: "v",        type: "uint8"    },
            { name: "r",        type: "bytes32"  },
            { name: "s",        type: "bytes32"  },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
      ],
      functionName: "permit",
      args: [
        userAddress,      // signer address
        vaultAddress,     // contract that will pull tokens
        maxUint256,       // allowance
        maxUint256,       // same you signed
        Number(v), r, s,  // from the signature
      ],
    })
    console.log('tx', tx);
    if (tx) {
      await client.waitForTransactionReceipt({ hash: tx });
    }
  };

  const handleStatusChange = (newStatus: LifecycleStatus) => {
    setDisabled(newStatus.statusName !== 'success');
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