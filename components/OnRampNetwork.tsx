"use client";
import { RampInstantSDK } from '@ramp-network/ramp-instant-sdk';

export default function OnRampMoneyWidget() { 
  const onrampInstance =  new RampInstantSDK({
    hostAppName: 'Your App',
    hostLogoUrl: 'https://assets.ramp.network/misc/test-logo.png',
    hostApiKey: 'your_host_api_key',
    variant: 'embedded-desktop',
    containerNode: document.getElementById('showOnramp'),
  }).show();

  return (
    <div>
    <button id="showOnramp" type="button" onClick={() => onrampInstance.show()}>Launch Onramp Widget</button>
    </div>  
  )
}
