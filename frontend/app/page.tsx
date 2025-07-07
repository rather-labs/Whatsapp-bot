import SignEIP712 from '@/app/components/SignEIP712'
import BuyTokens from '@/app/components/BuyTokens'
import FundTokens from '@/app/components/FundTokens'
import FundTokensCard from '@/app/components/FundCard'
export default function Home() {
  return (
    <main>
      <h1>Smart Wallet Integration</h1>
      <SignEIP712 />
      <h1>Buy Tokens</h1>
      <BuyTokens />
      <h1>Fund Tokens</h1>
      <FundTokens />
    </main>
  )
}