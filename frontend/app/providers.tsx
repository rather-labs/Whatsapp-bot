"use client";

import type { ReactNode } from "react";
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { 
  baseSepolia, 
  base, 
  localhost
} from 'wagmi/chains'; 
import { SignatureProvider } from './context/SignatureContext';

import { useState } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getConfig } from '@/wagmi'; // your import path may vary
import { WagmiProvider } from "wagmi";


export function Providers(props: { children: ReactNode }) {
  const getChain = () => {
    const chainName = process.env.NEXT_PUBLIC_CHAIN?.toLowerCase();
    console.log('chainName', chainName);
    switch (chainName) {
      case 'base':
        return base;
      case 'basesepolia':
        return baseSepolia;
      case 'localhost':
        return localhost;
      default:
        console.warn(`Chain "${process.env.NEXT_PUBLIC_CHAIN}" not recognized, defaulting to baseSepolia`);
        return baseSepolia;
    }
  };


  const [config] = useState(() => getConfig());
  const [queryClient] = useState(() => new QueryClient());

  const chain = getChain();

  return (
    <WagmiProvider config={config} >
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider 
          chain={chain} 
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY} 
          projectId={process.env.NEXT_PUBLIC_PROJECT_ID}
          config={{
            appearance: {
              name: 'Whatsapp Bot Base',
              logo: 'https://onchainkit.xyz/favicon/48x48.png?v4-19-24',
              mode: 'auto',
              theme: 'base',
            },
          }}
        >
          <SignatureProvider>
            {props.children}
          </SignatureProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}