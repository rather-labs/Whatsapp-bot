"use client";
import { useEffect } from 'react';
import { maxUint256, toHex } from 'viem';
import { erc20Abi } from 'viem';
import { useAccount, useWalletClient, useSwitchChain  } from 'wagmi';
import { useTransaction } from '../context/TransactionContext';

import { Transaction, type TransactionResponse, type LifecycleStatus, TransactionButton, TransactionToast, TransactionToastAction, TransactionToastLabel, TransactionToastIcon, TransactionSponsor } from '@coinbase/onchainkit/transaction';

export default function SignTransaction() {

  const { setSuccess, disabled, setDisabled, calls, setCalls } = useTransaction();
  const { chainId } = useAccount();
  const { data: walletClient } = useWalletClient();

  const vaultAddress = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as `0x${string}`
  const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`

  const { switchChain } = useSwitchChain();
    
  useEffect(() => { // without this, the signature is failing for testnet and localhost
    if (walletClient?.chain.id !== chainId) {
      switchChain({ chainId: walletClient?.chain.id as 31337 | 84532 | 8453 });
    }
  }, [walletClient?.chain.id, chainId, switchChain]); 

  useEffect(() => {
    console.log('Environment variables:', { tokenAddress, vaultAddress });
    
    // Only set calls if both addresses are valid and not empty
    if (tokenAddress && vaultAddress && tokenAddress !== '0x' && vaultAddress !== '0x') {
      console.log('Setting calls with valid addresses');
      setCalls([
        {
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [vaultAddress as `0x${string}`, maxUint256],
          value: BigInt(0)
        }
      ]);
    } else {
      console.log('Clearing calls due to invalid addresses');
      // Clear calls if addresses are invalid
      setCalls(null);
    }
  }, [tokenAddress, vaultAddress, setCalls]);

  const handleTransactionSuccess = async (tx: TransactionResponse) => {
    console.log('Transaction successful:', tx);
    console.log('Transaction receipt:', tx.transactionReceipts[0]);
    setSuccess(tx.transactionReceipts[0].status === 'success');
  };

  const handleStatusChange = (newStatus: LifecycleStatus) => {
    console.log('newStatus', newStatus);
    setDisabled(newStatus.statusName === 'success');
    setSuccess(newStatus.statusName === 'success');
  };

  // Early return if environment variables are missing
  if (!tokenAddress || !vaultAddress || tokenAddress === '0x' || vaultAddress === '0x') {
    console.log('Missing or invalid environment variables:', { tokenAddress, vaultAddress });
    return (
      <div className="w-full p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <p>Error: Missing environment variables</p>
        <p>Please set NEXT_PUBLIC_TOKEN_ADDRESS and NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS in your .env.local file</p>
        <p>Current values: Token={tokenAddress || 'undefined'}, Vault={vaultAddress || 'undefined'}</p>
      </div>
    );
  }

  console.log('calls', calls);
  console.log('disabled', disabled);
  
  // Additional check to ensure we don't render Transaction with invalid calls
  if (!calls || calls.length === 0) {
    console.log('No valid calls to render');
    return (
      <div className="w-full p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
        <p>Waiting for transaction configuration...</p>
      </div>
    );
  }

  return (
      <Transaction
        calls={calls}
        chainId={chainId}
        onSuccess={handleTransactionSuccess}
        onStatus={handleStatusChange}
        isSponsored={true}
      >
      <TransactionButton text="Approve token management" disabled={disabled} />
      <TransactionSponsor />
      <TransactionToast>
        <TransactionToastIcon />
        <TransactionToastLabel />
        <TransactionToastAction />
      </TransactionToast>
      </Transaction>
  );
} 