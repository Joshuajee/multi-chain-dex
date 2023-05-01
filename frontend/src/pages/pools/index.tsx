import Container from '@/components/utils/Container'
import Layout from '@/components/utils/Layout'
import { CHAIN_ID, ROUTES } from '@/libs/enums'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Address, useAccount, useContractRead } from 'wagmi'
import { convertToEther, convertToWEI, isAddressZero, supportedNetworks } from '@/libs/utils'
import MDexV1NativeFactoryABI from "@/abi/contracts/MDexV1NativeFactory.sol/MDexV1NativeFactory.json";



export default function Pools() {

    const router = useRouter()

    const { address, isConnected } = useAccount()

    const getPositions = useContractRead({
        address: supportedNetworks[1].factoryAddress as Address,
        abi: MDexV1NativeFactoryABI,
        functionName: 'getUserOpenPositions',
        enabled: isConnected,
        args: [address],
    })

    console.log(supportedNetworks[1].name)
    console.log(getPositions)

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
