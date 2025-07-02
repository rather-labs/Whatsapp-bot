"use client";


export default function OnRamperWidget() { 


  return ( 
  <iframe        
    src={`https://buy.onramper.com?apiKey=${process.env.NEXT_PUBLIC_ONRAMPER_API_KEY}&mode=buy`}
    title="Onramper Widget"
    height="630px"
    width="420px"
    allow="accelerometer; autoplay; camera; gyroscope; payment; microphone"
  />
  ) 
}
