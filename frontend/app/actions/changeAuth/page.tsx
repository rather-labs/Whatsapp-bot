"use client";

import { Wallet } from '@coinbase/onchainkit/wallet';
import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from 'wagmi';
import SignEIP712 from '../../components/SignEIP712';
import { useSignature } from '../../context/SignatureContext';
import TokenVaultWithRelayerJson from '../../utils/TokenVaultWithRelayer.json' assert { type: "json" };
import axios from 'axios';

export type ChangeAuthData = {
  whatsappNumber: string;
  authProfile: string;
};

export default function Home() {

  const vaultAddress = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as `0x${string}`

  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();

  const { setMessage, 
          setPrimaryType, 
          setLabel, 
          setDomain, 
          signature, 
          isSignatureValid, 
  } = useSignature();
  const [changeAuthData, setChangeAuthData] = useState<ChangeAuthData>({
    whatsappNumber: '',
    authProfile: ''
  });

  const [authorizationSubmitted, setAuthorizationSubmitted] = useState(false);

  const client = usePublicClient();

  const { switchChain } = useSwitchChain();
   
  // Get parameters from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setChangeAuthData({
        whatsappNumber: params.get("whatsappNumber") || '',
        authProfile: params.get("authProfile") || ''
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
      setPrimaryType('ChangeRiskProfile');
      setDomain({
        name: 'TokenVaultWithRelayer',
        version: '1',
        chainId: BigInt(chainId),
        verifyingContract: vaultAddress,
      });
    }
  }, [setPrimaryType, setDomain, chainId, vaultAddress]);

  useEffect(() => {    
    if (changeAuthData.whatsappNumber.length > 0 && client) {
      const getNonce = async () => {
        const nonce = await client.readContract({
          address: vaultAddress,
          abi: TokenVaultWithRelayerJson.abi,
          functionName: 'getNonce',
          args: [changeAuthData.whatsappNumber],
        });
        setMessage({
          user: BigInt(changeAuthData.whatsappNumber),
          authProfile: BigInt(changeAuthData.authProfile),
          nonce: nonce as bigint,
        });
        setLabel(`Sign authorization to change auth profile to ${changeAuthData.authProfile}`);
      }
      getNonce();
    }
  }, [changeAuthData, setMessage, vaultAddress, client, setLabel]);


  useEffect(() => {    
    if (signature && isSignatureValid) {
      submitVerification();
    }
  }, [signature, isSignatureValid]);

  async function submitVerification() {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/changeAuthProfile`, {
      whatsappNumber: changeAuthData.whatsappNumber,
      authProfile: changeAuthData.authProfile,
      signature: signature,
    });
    if (response.status === 200) {
      setAuthorizationSubmitted(true);
    } else {
      setAuthorizationSubmitted(false);
    }
  }

  return (
    <main className="flex flex-col items-center justify-center mt-8">        
      <div className="w-full flex justify-center z-50">
        <Wallet />
      </div>
     { address && (
        <div className="bg-white rounded-2xl p-6 shadow-md max-w-md w-full mt-4">
          <SignEIP712 />
        </div>
      )}
      { authorizationSubmitted  && (
        <div className="w-full flex justify-center mt-6">
          <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 rounded-md text-center max-w-xl">
            <strong className="block mb-1">Authorization submitted. Close this window.</strong>
          </div>
        </div>
      )}
    </main>
  );
}