"use client";

import { Wallet } from '@coinbase/onchainkit/wallet';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import SignPermit from '../components/SignPermit';
import { useSignature } from '../context/SignatureContext';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { signature, isSignatureValid } = useSignature();
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);

  // Get parameters from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setWhatsappNumber(params.get("whatsappNumber"));
      setUsername(params.get("username"));
    }
  }, []);

  const handleSubmit = async () => {
    if (isConnected && address && whatsappNumber && pin && signature && isSignatureValid) {
      console.log("Registering user with:", {
        whatsapp_number: whatsappNumber,
        username: username || whatsappNumber,
        pin: pin,
        signature: signature,
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
          window.close();
        } else {
          const errorData = await response.json();
          console.error("Registration failed:", response.status, errorData);
          alert(`Registration failed: ${errorData.error || 'Unknown error'}`);
        }
      } catch (err) {
        console.error("Failed to register:", err);
        alert(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
            } else {
          console.log("Missing required fields:", {
            isConnected,
            address: !!address,
            whatsappNumber: !!whatsappNumber,
            pin: !!pin,
            signature: !!signature,
            isSignatureValid
          });
          alert("Please ensure you are connected to your wallet, have entered a valid PIN, and have signed the permit");
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
                <SignPermit />
              </div>
              <button
                type="button"
                disabled={!pin || pin.length < 4 || pin.length > 6 || !signature || !isSignatureValid }
                onClick={() => handleSubmit()}
                className={`w-full py-3 rounded-lg font-bold text-[1.05em] transition-colors ${
                  !pin || pin.length < 4 || pin.length > 6 || !signature || !isSignatureValid
                    ? "bg-gray-200 text-[#A0A0A0] cursor-not-allowed"
                    : "bg-[#0052FF] text-white cursor-pointer"
                }`}
              >
                Submit Registration
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}