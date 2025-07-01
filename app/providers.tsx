"use client";

import type { ReactNode } from "react";
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { baseSepolia } from 'wagmi/chains'; // add base for production


export function Providers(props: { children: ReactNode }) {

  return (
    <OnchainKitProvider 
      chain={baseSepolia} 
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY} 
      projectId={process.env.NEXT_PUBLIC_PROJECT_ID}
    >
      {props.children}
    </OnchainKitProvider>
  );
}