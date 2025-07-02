"use client";
import { OnrampWebSDK } from '@onramp.money/onramp-web-sdk';

export default function OnRampMoneyWidget() { 
  const onrampInstance = new OnrampWebSDK({
    appId: 2, // Test appId
    walletAddress: '0x495f519017eF0368e82Af52b4B64461542a5430B', // replace with user's wallet address
    flowType: 1, // 1 -> onramp || 2 -> offramp || 3 -> Merchant checkout
    fiatType: 29, // Argentine peso
    paymentMethod: 1, // 1 -> Instant transafer(UPI) || 2 -> Bank transfer(IMPS/FAST)
    lang: 'vi', // for more lang values refer
    theme: {
      lightMode: {
      baseColor: '#000000', // * required (hex code e.g. #XXXXXX)
      inputRadius: '20px',  //optional (in px e.g. 20px)
      buttonRadius: '10px', //optional (in px e.g. 10px)
      },
      darkMode: {
      baseColor: '#000000', // * required (hex code e.g. #XXXXXX)
      inputRadius: '20px',  //optional (in px e.g. 20px)
      buttonRadius: '10px', //optional (in px e.g. 10px)
      }
    },
    widgetUrl: 'https://onramp.money/main/buy/?appId=2&coinCode=usdt&network=matic20-test',
    isRestricted: true, //true by default. hides navigation UI.
    // ... pass other configs
  });
  

  return (
    <div>
    <button id="showOnramp" type="button" onClick={() => onrampInstance.show()}>Launch Onramp Widget</button>
    </div>  
  )
}
