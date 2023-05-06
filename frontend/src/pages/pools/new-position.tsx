import TokenSelector from '@/components/wigets/TokenSelector'
import Container from '@/components/utils/Container'
import Layout from '@/components/utils/Layout'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import SelectToken from '@/components/wigets/SelectToken'
import { Address, useAccount, useContractRead, useContractReads, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi'
import MDexV1NativeFactoryABI from "@/abi/contracts/MDexV1NativeFactory.sol/MDexV1NativeFactory.json";
import { convertToEther, convertToWEI, isAddressZero, supportedNetworks } from '@/libs/utils'
import LoadingButton from '@/components/utils/LoadingButton'
import { CHAIN_ID,  GAS_FEES } from '@/libs/enums'
import { SUPPORTED_NETWORKS } from '@/libs/interfaces'

const tokenSelected = (chainId1: number, chainId2: number): boolean | undefined => {
    if (chainId1 === chainId2) return false
    if (chainId1 === CHAIN_ID.NONE || chainId2 === CHAIN_ID.NONE) return false
    return true
}


export default function NewPosition() {

    const router = useRouter()

    const { address, isConnected } = useAccount()

    const [amount1, setAmount1] = useState<number | string>(0)
    const [amount2, setAmount2] = useState<number | string>(0)

    const [pairIndex1, setPairIndex1] = useState<number | string>(0)
    const [pairIndex2, setPairIndex2] = useState<number | string>(0)

    const [pair1Details, setPair1Details] = useState<SUPPORTED_NETWORKS>(supportedNetworks[pairIndex1 as number])
    const [pair2Details, setPair2Details] = useState<SUPPORTED_NETWORKS>(supportedNetworks[pairIndex2 as number])

    const [hasSelected, setHasSelected] = useState(false)

    const [payment1, setPayment1] = useState<any>()
    const [payment2, setPayment2] = useState<any>()

    const pair1 = useContractRead({
        address: pair1Details.factoryAddress as Address,
        abi: MDexV1NativeFactoryABI,
        functionName: 'getPair',
        args: [pair1Details.chainId, pair2Details.chainId],
        chainId: pair1Details.chainId,
        enabled: tokenSelected(pair1Details.chainId, pair2Details.chainId)
    })

    const pair2 = useContractRead({
        address: pair2Details.factoryAddress as Address,
        abi: MDexV1NativeFactoryABI,
        functionName: 'getPair',
        args: [pair2Details.domainId, pair1Details.domainId],
        chainId: pair2Details.chainId
    })

    const gasQuotes = useContractRead({
        address: pair1Details.factoryAddress as Address,
        abi: MDexV1NativeFactoryABI,
        functionName: 'quoteGasPayment',
        args: [pair2Details.domainId, GAS_FEES.CREATE],
        chainId: pair1Details.chainId,
        enabled: tokenSelected(pair1Details.chainId, pair2Details.chainId)
    })

    //0.001473 
    const gasQuotes1 = useContractRead({
        address: pair1Details.factoryAddress as Address,
        abi: MDexV1NativeFactoryABI,
        functionName: 'quoteGasPayment',
        args: [pair2Details.domainId, GAS_FEES.ADD_LIQUIDITY],
        chainId: pair1Details.chainId,
        enabled: tokenSelected(pair1Details.chainId, pair2Details.chainId)
    })
    const gasQuotes2 = useContractRead({
        address: pair2Details.factoryAddress as Address,
        abi: MDexV1NativeFactoryABI,
        functionName: 'quoteGasPayment',
        args: [pair1Details.domainId, GAS_FEES.ADD_LIQUIDITY],
        chainId: pair2Details.chainId,
        enabled: tokenSelected(pair1Details.chainId, pair2Details.chainId)
    })

    const createPair = useContractWrite({
        mode: 'recklesslyUnprepared',
        address: pair1Details.factoryAddress as Address,
        abi: MDexV1NativeFactoryABI,
        functionName: 'createPair',
        args: [pair2Details.domainId, convertToWEI(amount1 as number), convertToWEI(amount2 as number), GAS_FEES.CREATE, pair2Details.factoryAddress, { value: payment1 }],
        chainId: pair1Details.chainId,
    })


    const waitCreatePair = useWaitForTransaction({
        hash: createPair.data as any,
    })

    const addLiquidity1 = useContractWrite({
        mode: 'recklesslyUnprepared',
        address: pair1Details.factoryAddress as Address,
        abi: MDexV1NativeFactoryABI,
        functionName: 'addLiquidity',
        args: [pair2Details.domainId, convertToWEI(amount1 as number), convertToWEI(amount2 as number), GAS_FEES.ADD_LIQUIDITY, pair2Details.factoryAddress, { value: payment1 }],
        chainId: pair1Details.chainId,
    })

    const addLiquidity2 = useContractWrite({
        mode: 'recklesslyUnprepared',
        address: pair2Details.factoryAddress as Address,
        abi: MDexV1NativeFactoryABI,
        functionName: 'addLiquidity',
        args: [pair1Details.domainId, convertToWEI(amount2 as number), convertToWEI(amount1 as number), GAS_FEES.ADD_LIQUIDITY, pair1Details.factoryAddress, { value: payment2 }],
        chainId: pair2Details.chainId,
    })

    console.log(pair1Details.domainId, " === ",pair2Details.factoryAddress,  pair1Details.chainId)

    const handleSelectPairIndex1 = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPairIndex1(e.target.value)
    }

    const handleSelectPairIndex2 = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPairIndex2(e.target.value)
    }

    // useEffect(() => {
    //     console.log(pair1);
    // }, [pair1])

    useEffect(() => {
        setPair1Details(supportedNetworks[pairIndex1 as number])
    }, [pairIndex1])

    useEffect(() => {
        setPair2Details(supportedNetworks[pairIndex2 as number])
    }, [pairIndex2])

    useEffect(() => {
        const gaspay = gasQuotes?.data //+ convertToWEI(amount1 as number) 

        const gaspay2 = gasQuotes2?.data 

        if (gaspay) {
            const value = BigInt(gaspay as any) + BigInt(convertToWEI(amount1 as number) as any)
            const value2 = BigInt(gaspay2 as any) + BigInt(convertToWEI(amount2 as number) as any)
            console.log(value)
            setPayment1(value)
            setPayment2(value2)
        }
        //setGas()
    }, [gasQuotes?.data, gasQuotes2?.data, amount1, amount2])

    useEffect(() => {
        setHasSelected(tokenSelected(pair1Details.chainId, pair2Details.chainId) as boolean)
    }, [pair1Details.chainId, pair2Details.chainId])

    console.log(pair1.data)
    console.log(pair2.data)

    console.log(addLiquidity2)




    return (
        <Layout>

            <Container>

                <div className='flex flex-col items-center w-full h-full'>

                    <div className={`mt-[20vh] text-gray-700 bg-white rounded-md p-4 md:px-4 shadow-lg w-full max-w-[800px] overflow-x-hidden`}>

                        <div className='flex'>
                            <h2 className='text-2xl font-medium'>Add Liquidity</h2>
                        </div>

                        <hr className='mt-2'></hr>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>

                            <div className='flex h-full flex-col'>

                                <h3 className='font-semibold my-1'>Select Pair</h3>

                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <SelectToken chainIndex={pairIndex1} handleSelectEvent={handleSelectPairIndex1} />
                                    <SelectToken chainIndex={pairIndex2} handleSelectEvent={handleSelectPairIndex2}/>
                                </div>
                                
                                {   tokenSelected(pair1Details.chainId, pair2Details.chainId) &&
                                    <div className='flex flex-col w-full py-3 px-1'>
                                        
                                        <p>You will earn 1% in fees</p>

                                        {
                                            isAddressZero(pair1?.data as Address) && isAddressZero(pair2?.data as Address) &&
                                                <p className='mt-2 font-semibold'>
                                                    Gas Fee: 
                                                    <strong className='ml-2'> {Number(convertToEther(gasQuotes?.data as number)).toFixed(4)} {pair1Details.symbol} </strong>
                                                </p>
                                        }

                                        {   Number(amount1) > 0 && Number(amount2) > 0 &&
                                            <p className='mt-2 font-semibold'>
                                                Price: 
                                                <strong className='ml-2'> 
                                                    1 {pair1Details.symbol} =  
                                                    { (Number(amount2) / Number(amount1))} {pair2Details.symbol} 
                                                </strong>
                                            </p>
                                        }



                                    </div>
                                }

                                <div className='flex-1'></div>

                                <div>
                                    {
                                        isAddressZero(pair1?.data as Address) && isAddressZero(pair2?.data as Address) &&
                                            <LoadingButton 
                                                loading={createPair.isLoading || waitCreatePair.isLoading} 
                                                onClick={() => createPair?.write?.()}> Create Pair 
                                            </LoadingButton>
                                    }
                                </div>
                                { hasSelected &&
                                    <>
                                        <div>
                                            {
                                                !isAddressZero(pair1?.data as Address) && !isAddressZero(pair2?.data as Address) &&
                                                <>    
                                                    <p className='mt-2 font-semibold'>
                                                        Gas Fee: 
                                                        <strong className='ml-2'> {Number(convertToEther(gasQuotes1?.data as number)).toFixed(4)} {pair1Details.symbol} </strong>
                                                    </p>
                                                    <LoadingButton 
                                                        loading={addLiquidity1.isLoading} 
                                                        onClick={() => addLiquidity1?.write?.()}> Add Liquidity {pair1Details.name}
                                                    </LoadingButton>
                                                </>
                                            }
                                        </div>

                                        <div>
                                            {
                                                !isAddressZero(pair1?.data as Address) && !isAddressZero(pair2?.data as Address) &&
                                                    <>

                                                        <p className='mt-2 font-semibold'>
                                                            Gas Fee: 
                                                            <strong className='ml-2'> {Number(convertToEther(gasQuotes2?.data as number)).toFixed(4)} {pair2Details.symbol} </strong>
                                                        </p>
                                                        <LoadingButton 
                                                            loading={addLiquidity2.isLoading} 
                                                            onClick={() => addLiquidity2?.write?.()}> Add Liquidity {pair2Details.name}
                                                        </LoadingButton>

                                                    </>
                                            }
                                        </div>
                                    </>
                                }

                            </div>

                            <div className='flex flex-col gap-2'>

                                <h3 className='font-semibold mt-2'> Enter Amount </h3>
                                
                                <TokenSelector 
                                    selectable={false} value={amount1} 
                                    chainIndex={pairIndex1} setValue={setAmount1} />

                                <TokenSelector 
                                    selectable={false} value={amount2} 
                                    chainIndex={pairIndex2} setValue={setAmount2} />

                            </div>

                        </div>

                    </div>

                </div>

            </Container>

        </Layout>
    )
}
