import TokenSelector from '@/components/wigets/TokenSelector'
import Container from '@/components/utils/Container'
import Layout from '@/components/utils/Layout'
import { CHAIN_ID } from '@/libs/enums'
import { useState } from 'react'


export default function Tokens() {

  const [valueFrom, setValueFrom] = useState("")
  const [valueTo, setValueTo] = useState("")

  const [chainIndexFrom, setChainIndexFrom] = useState<CHAIN_ID | string>(CHAIN_ID.MUMBAI)
  const [chainIndexTo, setChainIndexTo] = useState<CHAIN_ID | string>(CHAIN_ID.MUMBAI)


  return (
    <Layout>

      <Container>

        <div className='flex justify-center items-center w-full'>

          <div 
            className={`
              text-gray-700 bg-white rounded-lg border-blue-100 border-[2px] p-4 md:px-4 shadow-lg w-full max-w-[450px] overflow-x-hidden
            `}>

            <h1>Swap</h1>

            <TokenSelector selectable={true} value={valueFrom} chainIndex={chainIndexFrom} setValue={setValueFrom} setChainIndex={setChainIndexFrom}  />

            <TokenSelector selectable={true} value={valueTo} chainIndex={chainIndexTo} setValue={setValueTo} setChainIndex={setChainIndexTo} />

            <button className='bg-gray-200 rounded-2xl px-2 h-10 md:h-16 mt-2 w-full'>

            </button>

          </div>

        </div>

      </Container>

    </Layout>
  )
}
