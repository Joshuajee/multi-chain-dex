import Container from '@/components/utils/Container'
import Layout from '@/components/utils/Layout'
import { ROUTES } from '@/libs/enums'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Address, useAccount, useContractRead, useNetwork } from 'wagmi'
import { currencyByChainId, supportedNetworks } from '@/libs/utils'
import MDexV1NativeFactoryABI from "@/abi/contracts/MDexV1NativeFactory.sol/MDexV1NativeFactory.json";
import { POSITION } from '@/libs/interfaces'
import Pool from '@/components/utils/Pool'
import Web3btn from '@/components/utils/buttons/Web3btn'



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
        watch: true
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
                        text-gray-700 bg-white rounded-md p-4 md:px-4 shadow-lg w-full max-w-[800px] min-h-[200px] overflow-x-hidden
                        `}>

                        {
                            data?.map((position: POSITION, index: number) => {
                                return (<Pool key={index} position={position} currency={currency} factory={factory as Address} />)
                            })
                        }

                        <div className='flex justify-center items-center h-full'>

                            {   
                                isConnected ?
                                        data.length < 1 &&
                                            <p className='text-2xl font-bold'>
                                                You don&apos;t have any open position
                                            </p>
                                            :
                                            <div className='w-60'>
                                                <Web3btn chain='NONE' chainId={0}>Connect</Web3btn>
                                            </div>
                            }

                        </div>

                    </div>

                </div>

            </Container>

        </Layout>
    )
}
