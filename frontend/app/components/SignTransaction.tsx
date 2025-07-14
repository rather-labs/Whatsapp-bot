"use client";
import { useEffect } from 'react';
import { useAccount, useWalletClient, useSwitchChain  } from 'wagmi';
import { useTransaction } from '../context/TransactionContext';

import { Transaction, type TransactionResponse, type LifecycleStatus, TransactionButton, TransactionToast, TransactionToastAction, TransactionToastLabel, TransactionToastIcon, TransactionSponsor } from '@coinbase/onchainkit/transaction';

export default function SignTransaction() {

  const { setSuccess, disabled, setDisabled, calls } = useTransaction();
  const { chainId } = useAccount();
  const { data: walletClient } = useWalletClient();

  const { switchChain } = useSwitchChain();
    
  useEffect(() => { // without this, the signature is failing for testnet and localhost
    if (walletClient?.chain.id !== chainId) {
      switchChain({ chainId: walletClient?.chain.id as 31337 | 84532 | 8453 });
    }
  }, [walletClient?.chain.id, chainId, switchChain]); 

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