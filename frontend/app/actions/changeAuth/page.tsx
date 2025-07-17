"use client";

import { Wallet } from '@coinbase/onchainkit/wallet';
import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useTransaction } from '../../context/TransactionContext';
import SignTransaction from '../../components/SignTransaction';
import TokenVaultWithRelayerJson from '../../utils/TokenVaultWithRelayer.json' assert { type: "json" };
import { authProfiles } from '@/app/utils/dataStructures';

type ChangeAuthData = {
  whatsappNumber: string | null;
  authProfile: string | null;
};

export default function Home() {

  const vaultAddress = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as `0x${string}`

  const { address, isConnected } = useAccount();
  const { setCalls, setLabel, receipts } = useTransaction();
  const [changeAuthData, setChangeAuthData] = useState<ChangeAuthData>({
    whatsappNumber: null,
    authProfile: null
  });

  const client = usePublicClient();
  // Get parameters from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setChangeAuthData({
        whatsappNumber: params.get("whatsappNumber"),
        authProfile: params.get("profile")
      });
    }
  }, []);

  useEffect(() => {
    async function getData() {
      // Only set calls if both addresses are valid and not empty
      if (vaultAddress && vaultAddress !== '0x' 
          && client 
          && changeAuthData.whatsappNumber
          && changeAuthData.authProfile
        ) {
        const nonce = await client.readContract({
          address: vaultAddress,
          abi: TokenVaultWithRelayerJson.abi,
          functionName: 'getNonce',
          args: [changeAuthData.whatsappNumber],
        });
        setLabel(`Change authorization profile to ${changeAuthData.authProfile}`);
        setCalls([
          {
            address: vaultAddress as `0x${string}`, // 'to:' fails
            abi: TokenVaultWithRelayerJson.abi,
            functionName: 'ChangeAuthProfile',
            args: [changeAuthData.whatsappNumber, 
                   BigInt(authProfiles.indexOf(changeAuthData.authProfile.toLowerCase())), 
                   nonce
                  ],
            value: BigInt(0)
          }
        ]);
      } else {
        // Clear calls if addresses are invalid
        setCalls(null);
      }
    }
  getData();
  }, [vaultAddress, setCalls, changeAuthData, setLabel, client]);


  useEffect(() => {
    console.log('receipts', receipts);
  }, [receipts]);

  return (
    <main>
      <div className="flex flex-col items-center justify-center mt-8">
        <div className="w-full flex justify-center">
          <Wallet />
        </div>
        {address && isConnected && (
          <div className="w-full flex justify-center mt-6">
              <div className="bg-white rounded-2xl p-6 shadow-md max-w-md w-full mt-4">
                <SignTransaction />
              </div>
          </div>
        )}
        {receipts && receipts[0].status === 'success' && (
          <div className="flex justify-center">
            <div className="text-[#276749] bg-[#F0FFF4] rounded-md px-4 py-2 text-lg font-bold self-center">
              Authorization profile changed successfully. <br/>
              You may now close this window.
            </div>
          </div>
        )}
        {receipts && receipts[0].status === 'reverted' && (
          <div className="flex justify-center">
            <div className="text-[#991B1B] bg-[#FEE2E2] rounded-md px-4 py-2 text-lg font-bold self-center">
              Authorization profile change failed. <br/>
              Transaction hash: {receipts[0].transactionHash}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}