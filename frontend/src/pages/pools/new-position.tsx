import TokenSelector from '@/components/wigets/TokenSelector'
import Container from '@/components/utils/Container'
import Layout from '@/components/utils/Layout'
import { CHAIN_ID, ROUTES } from '@/libs/enums'
import { useRouter } from 'next/router'
import { useState } from 'react'
import SelectToken from '@/components/wigets/SelectToken'
import { useAccount, useBalance } from 'wagmi'


export default function NewPosition() {

    const router = useRouter()

    const [amount1, setAmount1] = useState<number | string>(0)
    const [amount2, setAmount2] = useState<number | string>(0)

    const [pairIndex1, setPairIndex1] = useState<number | string>(0)
    const [pairIndex2, setPairIndex2] = useState<number | string>(0)

    const { address, isConnected } = useAccount()


    const handleChangeAmount1 = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount1(e.target.value)
    }

    const handleChangeAmount2 = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount2(e.target.value)
    }

    const handleSelectPairIndex1 = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPairIndex1(e.target.value)
    }

    const handleSelectPairIndex2 = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPairIndex2(e.target.value)
    }


    return (
        <Layout>

            <Container>

                <div className='flex flex-col items-center w-full'>

                    <div className={`mt-[20vh] text-gray-700 bg-white rounded-md p-4 md:px-4 shadow-lg w-full max-w-[800px] min-h-[200px] max-h-[calc(100vh_-_100px)] overflow-x-hidden`}>

                        <div className='flex'>

                            <h2 className='text-2xl font-medium'>Add Liquidity</h2>

                        </div>

                        <hr className='mt-2'></hr>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>

                            <div>

                                <h3 className='font-semibold my-1'>Select Pair</h3>

                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <SelectToken chainIndex={pairIndex1} handleSelectEvent={handleSelectPairIndex1} />
                                    <SelectToken chainIndex={pairIndex2} handleSelectEvent={handleSelectPairIndex2}/>
                                </div>

                                <div className='w-full py-3 px-1'>
                                    <p>You will earn 1% in fees</p>
                                </div>


                            </div>

                            <div className='flex flex-col'>

                                <h3 className='font-semibold'> Enter Amount </h3>
                                
                                <TokenSelector selectable={false} value={pairIndex1} chainIndex={pairIndex1} />

                                <TokenSelector selectable={false} value={pairIndex2} chainIndex={pairIndex2} />

                            </div>






                        </div>


                    </div>

                </div>

            </Container>

        </Layout>
    )
}
