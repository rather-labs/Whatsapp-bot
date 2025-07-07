import { http, cookieStorage, createConfig, createStorage } from 'wagmi';
import { base, baseSepolia, localhost } from 'wagmi/chains'; 
import { coinbaseWallet } from 'wagmi/connectors';

export function getConfig() {

  const chain = process.env.NEXT_PUBLIC_CHAIN === 'base' ? base : 
                process.env.NEXT_PUBLIC_CHAIN === 'baseSepolia' ? baseSepolia :
                localhost;

  return createConfig({
    connectors: [
      coinbaseWallet({
        appName: 'OnchainKit',
        preference: 'smartWalletOnly',
        version: '4',
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    chains: [chain],
    transports: {
      [base.id]: http(),
      [baseSepolia.id]: http(),
      [localhost.id]: http(),
    },
  });
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}