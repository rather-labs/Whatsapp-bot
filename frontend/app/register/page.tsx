"use client";

import { Wallet } from '@coinbase/onchainkit/wallet';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { erc20Abi, maxUint256 } from 'viem';
import { useTransaction } from '../context/TransactionContext';
import SignTransaction from '../components/SignTransaction';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { success, setCalls } = useTransaction();
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Get parameters from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setWhatsappNumber(params.get("whatsappNumber"));
      setUsername(params.get("username"));
    }
  }, []);

  const vaultAddress = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as `0x${string}`
  const tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`

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

  useEffect(() => {
    async function checkRegistration() {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/check/${whatsappNumber}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
      });
      const data = await response.json();
      setIsSubmitted(data.registered);
    }
    checkRegistration();
  }, [whatsappNumber]);

  const handleSubmit = async () => {
    if (isConnected && address && whatsappNumber && pin && success ) {
      console.log("Registering user with:", {
        whatsapp_number: whatsappNumber,
        username: username || whatsappNumber,
        pin: pin,
        backend_url: process.env.NEXT_PUBLIC_BACKEND_URL
      });
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            whatsapp_number: whatsappNumber,
            username: username || whatsappNumber,
            pin: pin,
            wallet_address: address,
          })
        });
        
        console.log("Response status:", response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Registration successful:", data);
          setIsSubmitted(true);
        } else {
          const errorData = await response.json();
          console.error("Registration failed:", response.status, errorData);
          if (errorData.error === "User already exists") {
            setIsSubmitted(true);
          } else {
            alert(`Registration failed: ${errorData.error || 'Unknown error'}`);
          }
        }
      } catch (err) {
        console.error("Failed to register:", err);
        alert(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } else {
      console.log("Missing required fields:", {
        whatsappNumber: !!whatsappNumber,
        username: !!username,
        pin: !!pin,
        success: !!success,
        isConnected: !!isConnected,
        address: !!address
      });
      alert("Please ensure you are connected to your wallet, have entered a valid PIN, and have signed the approval transaction. If you have already signed the transaction, please wait for it to be confirmed.");
    }
  };

  return (
    <main>
      <div className="flex flex-col items-center justify-center mt-8">
        <div className="w-full flex justify-center">
          <Wallet />
        </div>
        {address && (
          <>
            <div className="w-full flex justify-center mt-6">
            </div>
            <div className="flex flex-col gap-6 items-center bg-[#F7F8FA] rounded-2xl p-8 shadow-md max-w-sm w-full mt-8">
              <div className="w-full p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl shadow flex flex-col gap-2 border border-gray-200 mb-2">
                <div className="font-bold text-gray-800 text-base flex items-center gap-2 mb-1">
                  Registration Information
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700 w-24">WhatsApp:</span>
                  <span className={`px-2 py-1 rounded ${whatsappNumber ? "text-gray-900" : "text-gray-400"}`}>
                    {whatsappNumber || 'Not set'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700 w-24">Username:</span>
                  <span className={`px-2 py-1 rounded ${username ? "text-gray-900" : "text-gray-400"}`}>
                    {username || 'Not set'}
                  </span>
                </div>
              </div>
              {isSubmitted && (
                <div className="text-[#276749] bg-[#F0FFF4] rounded-md px-4 py-2 text-lg font-bold self-start">
                  User registered.<br />You may now close this window.
                </div>
              )}
              <div className={`${isSubmitted ? "hidden" : ""}`}>
                <label
                  htmlFor="pin-input"
                  className="font-semibold text-[1.1em] text-[#1A1A1A] mb-2 self-start"
                >
                  Enter a PIN
                  <span className="text-[#A0A0A0] font-normal">(4-6 digits)</span>
                </label>
                <input
                  id="pin-input"
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4,6}"
                  maxLength={6}
                  minLength={4}
                  value={pin ?? ""}
                  onChange={e => {
                    const val = e.target.value;
                    // Only allow digits and up to 6 characters
                    if (/^\d{0,6}$/.test(val)) {
                      setPin(val);
                    }
                  }}
                  placeholder="Enter PIN"
                  autoComplete="off"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-base bg-white text-[#1A1A1A] outline-none box-border font-inherit tracking-widest"
                />
                {pin && (pin.length < 4 || pin.length > 6) && (
                  <div className="text-[#E53E3E] bg-[#FFF5F5] rounded-md px-4 py-2 text-[0.95em] self-start">
                    PIN must be 4 to 6 digits.
                  </div>
                )}
                <div className="bg-white rounded-2xl p-6 shadow-md max-w-md w-full mt-4">
                  <SignTransaction />
                </div>
                <button
                  type="button"
                  disabled={!pin || pin.length < 4 || pin.length > 6 || !success }
                  onClick={() => handleSubmit()}
                  className={`w-full py-3 rounded-lg font-bold text-[1.05em] transition-colors ${
                    !pin || pin.length < 4 || pin.length > 6 || !success
                      ? "bg-gray-200 text-[#A0A0A0] cursor-not-allowed"
                      : "bg-[#0052FF] text-white cursor-pointer"
                  }`}
                >
                  Submit Registration
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}