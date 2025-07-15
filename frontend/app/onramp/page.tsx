"use client";

import { Wallet } from '@coinbase/onchainkit/wallet';
import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from 'wagmi';
import type { Token } from '@coinbase/onchainkit/token';
import { Buy } from '@coinbase/onchainkit/buy';
import { FundButton } from '@coinbase/onchainkit/fund';
import SignEIP712 from '../components/SignEIP712';
import { useSignature } from '../context/SignatureContext';
import TokenVaultWithRelayerJson from '../utils/TokenVaultWithRelayer.json' assert { type: "json" };
import type { DepositData } from '../utils/dataStructures';
import axios from 'axios';
import OnchainKitButton from '../components/OnChainKitButton';

export default function Home() {

  const vaultAddress = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as `0x${string}`
  const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`

  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();

  const { setMessage, setPrimaryType, setLabel, setDomain, signature, isSignatureValid } = useSignature();
  const [depositData, setDepositData] = useState<DepositData>({
    whatsappNumber: '',
    amount: '',
    signatureRequired: false,
  });

  const [depositSubmitted, setDepositSubmitted] = useState(false);
  const [onRampSuccess, setOnRampSuccess] = useState(false);
  const [signatureRequired, setSignatureRequired] = useState(false);

  const client = usePublicClient();

  const { switchChain } = useSwitchChain();
   
  const [tokenInfo, setTokenInfo] = useState<Token>({
    name: 'USD Coin',
    address: tokenAddress,
    symbol: 'USDC',
    decimals: 6,
    image: 'usdc-icon.svg',
    chainId: chainId as number,
  });

  // Get parameters from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setDepositData({
        whatsappNumber: params.get("whatsappNumber") || '',
        amount: params.get("amount") || '',
        signatureRequired: params.get("signatureRequired") === 'true',
      });
    }
  }, []);

  useEffect(() => { // without this, the signature is failing for testnet and localhost
    if (walletClient?.chain.id !== chainId) {
      switchChain({ chainId: walletClient?.chain.id as 31337 | 84532 | 8453 });
    }
  }, [walletClient?.chain.id, chainId, switchChain]);

  useEffect(() => {
    if (chainId) {
      setPrimaryType('deposit');
      setDomain({
        name: 'TokenVaultWithRelayer',
        version: '1',
        chainId: BigInt(chainId),
        verifyingContract: vaultAddress,
      });
    }
  }, [setPrimaryType, setLabel, setDomain, chainId, vaultAddress]);

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
  }, [client, tokenAddress, vaultAddress, chainId, depositData, setTokenInfo]);

  useEffect(() => {    
    if (depositData.whatsappNumber.length > 0 && client) {
      const getNonce = async () => {
        const nonce = await client.readContract({
          address: vaultAddress,
          abi: TokenVaultWithRelayerJson.abi,
          functionName: 'getNonce',
          args: [depositData.whatsappNumber],
        });
        setMessage({
          user: BigInt(depositData.whatsappNumber),
          assets: BigInt(depositData.amount),
          nonce: nonce as bigint,
        });
        setLabel(`Sign approval for deposit of ${depositData.amount} ${tokenInfo.symbol}`);
      
      }
      getNonce();
    }
  }, [depositData, setMessage, vaultAddress, client]);

  useEffect(() => {    
    if (signature && isSignatureValid && !signatureRequired) {
      submitDeposit();
    }
  }, [signature, isSignatureValid, depositData, submitDeposit]);

  async function submitDeposit() {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/deposit`, {
      whatsappNumber: depositData.whatsappNumber,
      amount: depositData.amount,
      signature: signature,
    });
    if (response.status === 200) {
      setDepositSubmitted(true);
    } else {
      setDepositSubmitted(false);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center mt-8">        
      <div className="w-full flex justify-center z-50">
        <Wallet />
      </div>
      { address && ( // TODO: remove this once the on-ramp is available
        <div className="w-full flex justify-center mt-6">
          <Buy toToken={tokenInfo} isSponsored disabled={true}/>
        </div>
      )}
      { address && (
        <div className="w-full flex justify-center mt-6">
          <FundButton disabled={true}/>
        </div>
      )}
      { address && (
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
      { address && signatureRequired && (
        <div className="bg-white rounded-2xl p-6 shadow-md max-w-md w-full mt-4">
          <SignEIP712 />
        </div>
      )}
      { address && !signatureRequired && (
        <div className="w-full flex justify-center mt-6">
          <OnchainKitButton onClick={submitDeposit}>
            Submit Deposit
          </OnchainKitButton>
        </div>
      )}
      { depositSubmitted && (
        <div className="w-full flex justify-center mt-6">
          <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 rounded-md text-center max-w-xl">
            <strong className="block mb-1">Deposit Submitted. Close this window.</strong>
          </div>
        </div>
      )}
    </main>
  );
}