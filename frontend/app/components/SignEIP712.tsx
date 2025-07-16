"use client";
import { useEffect } from 'react';
import { type LifecycleStatus, Signature } from '@coinbase/onchainkit/signature';
import { usePublicClient, useAccount, useWalletClient, useSwitchChain  } from 'wagmi';
import { useSignature } from '../context/SignatureContext';
import { type Domain, type Message, types } from '../utils/dataStructures';
import type { APIError } from '@coinbase/onchainkit/api';
import { parseErc6492Signature } from 'viem';

export default function SignEIP712() {

  const { 
    setSignature, setIsSignatureValid, disabled, setDisabled, message,
    domain, primaryType, label
  } = useSignature();
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();

  const userAddress = address as `0x${string}`;

  const client = usePublicClient();

  const { switchChain } = useSwitchChain();
   
  useEffect(() => { // without this, the signature is failing for testnet and localhost
    if (walletClient?.chain.id !== chainId) {
      switchChain({ chainId: walletClient?.chain.id as 31337 | 84532 | 8453 });
    }
  }, [walletClient?.chain.id, chainId, switchChain]); 

  const handleSignatureSuccess = async (newSignature: string) => {
    // Extract the actual 65-byte (r,s,v) signature out of the ERC-6492 wrapper.
    const parsedSignature = parseErc6492Signature(newSignature as `0x${string}`).signature;

    // Store the clean signature so that the backend / relayer submits the correct 65-byte value on-chain.
    setSignature(newSignature as `0x${string}`);

    // Validate the signature against the typed data using the parsed value.
    const isNewSignatureValid = await client.verifyTypedData({
      address: userAddress,
      signature: parsedSignature,
      domain: domain as Domain,
      primaryType: primaryType,
      message: message as Message,
      types: types[primaryType as keyof typeof types],
    });

    console.log('isNewSignatureValid', isNewSignatureValid);
    setIsSignatureValid(isNewSignatureValid);
  };

  const handleStatusChange = (newStatus: LifecycleStatus) => {
    setDisabled(newStatus.statusName === 'success');
  };

  const handleError = async (error: APIError) => {
    console.error('Error:', error);
  };

  return (
    <div className="w-full">
      {message && (
        <Signature
          domain={domain as Domain}
          types={types[primaryType as keyof typeof types]}
          primaryType={primaryType} 
          message={message}
          label={label}
          onSuccess={handleSignatureSuccess}
          onStatus={handleStatusChange}
          onError={handleError}
          disabled={disabled || !domain}
        />
      )}
    </div>
  );
} 