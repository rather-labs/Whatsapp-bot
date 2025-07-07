"use client";
import { useEffect, useState } from 'react';
import { encodeFunctionData, decodeFunctionData, parseAbi } from 'viem';
import { type LifecycleStatus, Signature } from '@coinbase/onchainkit/signature';
import { usePublicClient, useChainId } from 'wagmi';

type EIP712Message = {
  from: `0x${string}`;
  fromWhatsapp: string;
  to: `0x${string}`;
  toWhatsapp: string;
  toWhatsappName: string;
  value: number;
  gas: number;
  nonce: number;
  data: `0x${string}`;
};

function formatMessage(message: EIP712Message) {
  const data = decodeFunctionData({
    abi: parseAbi(['function transfer(address to,uint256 amount)']),
    data: message.data
  });
  if (data.functionName === 'transfer') { 
    return `Sign to transfer ${data.args[1]} USDC
From ${message.fromWhatsapp} 
To ${message.toWhatsappName ? message.toWhatsappName  : message.toWhatsapp} ${message.toWhatsappName ? `(${message.toWhatsapp})` : ''}
`;
  } 
  throw new Error('Unrecognized function name');
}

export default function SignEIP712() {

  const userAddress = '0x59EE67662D98e31628ea4ce3718707C881B04Cc9' as `0x${string}`
  const vaultAddress = '0x59EE67662D98e31628ea4ce3718707C881B04Cc9' as `0x${string}`
  const chainId = useChainId();

  const client = usePublicClient();

  // encode the contract call
  const data = encodeFunctionData({
    abi: parseAbi(['function transfer(address to,uint256 amount)']),
    functionName: 'transfer',
    args: [userAddress, BigInt(10)]
  });

  const domain = {
    name: 'Whatsapp Bot Base',
    version: '1.0.0',
    chainId: chainId,
    verifyingContract: userAddress,
  };
  
  const types  = { 
    ForwardRequest: [
      {name:'from',type:'address'},
      {name:'to',type:'address'},
      {name:'toWhatsapp',type:'string'},
      {name:'toWhatsappName',type:'string'},
      {name:'value',type:'uint256'},
      {name:'gas',type:'uint256'},
      {name:'nonce',type:'uint256'},
      {name:'data',type:'bytes'}
    ]
  }
  
  const message = { 
    from: userAddress, 
    fromWhatsapp: '+5491133333333',
    to: vaultAddress, 
    toWhatsapp: '+5491133333333',
    toWhatsappName: 'John Doe',
    value: 0, 
    gas: 90_000, 
      nonce:1,
      data 
    };


  const [signature, setSignature] = useState<string | null>(null);
  const [status, setStatus] = useState<LifecycleStatus | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Message rerenders and should not be used
  useEffect(() => {
    if (signature && client && message) {
      const isValid = client.verifyTypedData({
        address: userAddress,
        signature: signature as `0x${string}`,
        primaryType: 'ForwardRequest',
        message,
        types,
      }); 
      console.log(isValid);
  }
  }, [signature, client]);

  return (
    <div>
      <Signature
        domain={domain}
        types={types}
        primaryType="ForwardRequest"
        message={message}
        label="Sign EIP712"
        onSuccess={(signature: string) => setSignature(signature)}
        onStatus={(status: LifecycleStatus) => setStatus(status)}
        className="custom-class"
        disabled={status?.statusName === 'success'}
      />
      <p>{signature}</p>
    </div>
  );
}