import SignEIP712 from '@/components/SignEIP712'
import BuyTokens from '@/components/BuyTokens'
import FundTokens from '@/components/FundTokens'
import FundTokensCard from '@/components/FundCard'
import OnRamperWidget from '@/components/OnRamper'
import OnRampMoneyWidget from '@/components/OnRampMoney'

export default function Home() {
  return (
    <main>
      <h1>Smart Wallet Integration</h1>
      <SignEIP712 />
      <h1>Buy Tokens</h1>
      <BuyTokens />
      <h1>Fund Tokens</h1>
      <FundTokens />
      <h1>OnRamper Widget</h1>
      <OnRamperWidget />
      <h1>OnRampMoney Widget</h1>
      <OnRampMoneyWidget />
    </main>
  )
}