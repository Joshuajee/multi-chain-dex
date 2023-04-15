import TokenSelector from '@/components/wigets/TokenSelector'
import Container from '@/components/utils/Container'
import Layout from '@/components/utils/Layout'
import { CHAIN_ID } from '@/libs/enums'
import { useState } from 'react'


export default function Home() {

  const [error, setError] = useState<string | null>(null)

  const [valueFrom, setValueFrom] = useState("")
  const [valueTo, setValueTo] = useState("")

  const [chainIdFrom, setChainIdFrom] = useState<number | string>(0)
  const [chainIdTo, setChainIdTo] = useState<number| string>(0)


  return (
    <Layout>

      <Container>

        <div className='flex justify-center items-center w-full'>

          <div 
            className={`
              text-gray-700 bg-white rounded-md p-4 md:px-4 shadow-lg w-full max-w-[450px] overflow-x-hidden
            `}>

            <h1>Swap</h1>

            <TokenSelector selectable={true} value={valueFrom} chainIndex={chainIdFrom} setValue={setValueFrom} setChainIndex={setChainIdFrom}  />

            <TokenSelector selectable={true} value={valueTo} chainIndex={chainIdTo} setValue={setValueTo} setChainIndex={setChainIdTo} />

            <button className={`${error ?  'bg-gray-200' : 'bg-green-600 hover:bg-green-700 text-white' } rounded-2xl px-2 h-10 md:h-16 mt-2 w-full`}>
              SWAP
            </button>

          </div>

        </div>

      </Container>

    </Layout>
  )
}
