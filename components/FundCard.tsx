"use client";
import { FundCard } from '@coinbase/onchainkit/fund';


export default function FundTokensCard() { 

  return ( 
    <FundCard 
      assetSymbol="USDC"
      country="AR"
      currency="ARS"
      headerText="Buy USDC"
      buttonText="Buy"
    />
  ) 
}
