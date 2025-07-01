"use client";
import { FundButton } from '@coinbase/onchainkit/fund';
import { fetchOnrampConfig } from '@coinbase/onchainkit/fund';
import { useEffect } from 'react';


export default function FundTokens() { 

  // When using with OnchainKitProvider

  useEffect(() => {
    const fetchConfig = async () => {
      const config = await fetchOnrampConfig();
      console.log(config);
    };
    fetchConfig();
  }, []);

  return ( 
    <FundButton />
  ) 
}
