import Container from '@/components/utils/Container'
import Layout from '@/components/utils/Layout'
import { ROUTES } from '@/libs/enums'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Address, useAccount, useContractRead, useNetwork } from 'wagmi'
import { convertToEther, convertToWEI, currencyByChainId, isAddressZero, supportedNetworks } from '@/libs/utils'
import MDexV1NativeFactoryABI from "@/abi/contracts/MDexV1NativeFactory.sol/MDexV1NativeFactory.json";
import { POSITION } from '@/libs/interfaces'
import LoadingButton from '@/components/utils/LoadingButton'



export default function Pools() {

    const router = useRouter()

    const { address, isConnected } = useAccount()

    const [data, setData] = useState<POSITION[]>([])

    const [currency, setCurrency] = useState("")

    const [factory, setFactory] = useState<Address | null>(null)

    const { chain } = useNetwork()

    const getPositions = useContractRead({
        address: factory as Address,
        abi: MDexV1NativeFactoryABI,
        functionName: 'getUserOpenPositions',
        enabled: isConnected && factory != null,
        args: [address],
    })

    useEffect(() => {
        if (getPositions?.data) setData(getPositions?.data as POSITION[])
    }, [getPositions?.data])

    useEffect(() => {
        setCurrency(currencyByChainId(chain?.id as number))
    }, [getPositions?.data, chain?.id])

    useEffect(() => {
        setCurrency(currencyByChainId(chain?.id as number))
        for (let i = 0; i < supportedNetworks.length; i++) {
            if (supportedNetworks[i].domainId === chain?.id) {
                setFactory(supportedNetworks[i].factoryAddress as Address)
                break
            }
        }
    }, [getPositions?.data, chain?.id])

    return (
        <Layout>

            <Container>

                <div className='flex flex-col items-center w-full'>

                    <div className='mt-[20vh] flex justify-between w-full max-w-[800px] my-4'>
                        
                        <h2 className='text-3xl font-medium'>Pools</h2>

                        <button onClick={() => router.push(ROUTES.NEW_POSITION)} className='bg-blue-300 hover:bg-blue-400 px-4 rounded-lg'>New Position</button>
                    
                    </div>

                    <div 
                        className={`flex flex-col space-y-2
                        text-gray-700 bg-white rounded-md p-4 md:px-4 shadow-lg w-full max-w-[800px] min-h-[200px] max-h-[calc(100vh_-_100px)] overflow-x-hidden
                        `}>

                        {
                            data?.map((position: POSITION, index: number) => {
                                return (
                                    <div className='font-medium border-cyan-700 border-[1px] p-2 rounded-md' key={index}> 

                                        <h3 className='font-bold'> ETH / MATIC </h3>

                                        <div className='flex justify-between'>
                                            <p>Investment 1: {convertToEther(position.amountIn1)} {currency}</p>
                                            <p>Investment 2: {convertToEther(position.amountIn2)} </p>
                                        </div>

                                        <div className='flex justify-between'>
                                            <p>Available Fees: {convertToEther(position.availableFees)} {currency} </p>
                                            <p>Total Fees: {convertToEther(position.totalFees)} {currency} </p>
                                        </div>

                                        <div className='flex space-x-5 justify-between'>

                                            <LoadingButton color='green'>Collect Fees</LoadingButton>

                                            <LoadingButton color='yellow'>Switch To</LoadingButton>
                                        
                                        </div>

                                    </div>
                                )
                            })
                        }

                    </div>

                </div>

            </Container>

        </Layout>
    )
}
