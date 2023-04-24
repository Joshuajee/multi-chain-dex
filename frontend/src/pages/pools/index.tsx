import Container from '@/components/utils/Container'
import Layout from '@/components/utils/Layout'
import { CHAIN_ID, ROUTES } from '@/libs/enums'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useContractRead } from 'wagmi'


export default function Pools() {

    const router = useRouter()

    const [valueFrom, setValueFrom] = useState("")
    const [valueTo, setValueTo] = useState("")

    const [chainIdFrom, setChainIdFrom] = useState<CHAIN_ID | string>(CHAIN_ID.MUMBAI)
    const [chainIdTo, setChainIdTo] = useState<CHAIN_ID | string>(CHAIN_ID.MUMBAI)


    // const pair1 = useContractRead({
    //     address: pair1Details.factoryAddress as Address,
    //     abi: MDexV1NativeFactoryABI,
    //     functionName: 'getPair',
    //     //args: [pair1Details.chainId, pair2Details.chainId],
    // })

    return (
        <Layout>

            <Container>

                <div className='flex flex-col items-center w-full'>

                    <div className='mt-[20vh] flex justify-between w-full max-w-[800px] my-4'>
                        
                        <h2 className='text-3xl font-medium'>Pools</h2>

                        <button onClick={() => router.push(ROUTES.NEW_POSITION)} className='bg-blue-300 hover:bg-blue-400 px-4 rounded-lg'>New Position</button>
                    
                    </div>

                    <div 
                        className={`
                        text-gray-700 bg-white rounded-md p-4 md:px-4 shadow-lg w-full max-w-[800px] min-h-[200px] max-h-[calc(100vh_-_100px)] overflow-x-hidden
                        `}>


                    </div>

                </div>

            </Container>

        </Layout>
    )
}
