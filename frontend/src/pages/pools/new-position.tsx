import TokenSelector from '@/components/wigets/TokenSelector'
import Container from '@/components/utils/Container'
import Layout from '@/components/utils/Layout'
import { useEffect, useState } from 'react'
import SelectToken from '@/components/wigets/SelectToken'
import { Address, useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi'
import MDexV1NativeFactoryABI from "@/abi/contracts/MDexV1NativeFactory.sol/MDexV1NativeFactory.json";
import MDexV1PairNativeABI from "@/abi/contracts/MDexV1PairNative.sol/MDexV1PairNative.json";
import { convertToEther, convertToWEI, getPriceRatio, isAddressZero, supportedNetworks } from '@/libs/utils'
import LoadingButton from '@/components/utils/LoadingButton'
import { CHAIN_ID,  GAS_FEES } from '@/libs/enums'
import { POSITION, SUPPORTED_NETWORKS } from '@/libs/interfaces'
import { BigNumber } from 'ethers'
import AddLiquidity from '@/components/utils/buttons/AddLiquidity'
import CreatePair from '@/components/utils/buttons/CreatePair'

const tokenSelected = (chainId1: number, chainId2: number): boolean => {
    if (chainId1 === chainId2) return false
    if (chainId1 === CHAIN_ID.NONE || chainId2 === CHAIN_ID.NONE) return false
    return true
}


export default function NewPosition() {

    const { address } = useAccount()

    const [isAvailable, setIsAvaliable] = useState(false);

    const [price, setPrice] = useState<number>(1)

    const [amount1, setAmount1] = useState<number | undefined>()
    const [amount2, setAmount2] = useState<number | undefined>()

    const [pairIndex1, setPairIndex1] = useState<number | string>(0)
    const [pairIndex2, setPairIndex2] = useState<number | string>(0)

    const [pair1Details, setPair1Details] = useState<SUPPORTED_NETWORKS>(supportedNetworks[pairIndex1 as number])
    const [pair2Details, setPair2Details] = useState<SUPPORTED_NETWORKS>(supportedNetworks[pairIndex2 as number])

    const [hasSelected, setHasSelected] = useState(false)

    const [disable1, setDisable1] = useState(false)
    const [disable2, setDisable2] = useState(false)

    const pair1 = useContractRead({
        address: pair1Details.factoryAddress as Address,
        abi: MDexV1NativeFactoryABI,
        functionName: 'getPair',
        args: [pair1Details.chainId, pair2Details.chainId],
        chainId: pair1Details.chainId,
        enabled: hasSelected
    })

    const pair2 = useContractRead({
        address: pair2Details.factoryAddress as Address,
        abi: MDexV1NativeFactoryABI,
        functionName: 'getPair',
        args: [pair2Details.domainId, pair1Details.domainId],
        chainId: pair2Details.chainId,
        enabled: hasSelected
    })

    const pair2Reserve1 = useContractRead({
        address: pair2.data as Address,
        abi: MDexV1PairNativeABI,
        functionName: 'reserve1',
        chainId: pair2Details.chainId,
        enabled: isAvailable
    })
    
    const pair2Reserve2 = useContractRead({
        address: pair2.data as Address,
        abi: MDexV1PairNativeABI,
        functionName: 'reserve2',
        chainId: pair2Details.chainId,
        enabled: isAvailable
    })


    const pair2pending = useContractRead({
        address: pair2.data as Address,
        abi: MDexV1PairNativeABI,
        functionName: 'getPendingPositionsByAddress',
        chainId: pair2Details.chainId,
        args: [address],
        enabled: isAvailable,
        watch: true
    })

    const handleSelectPairIndex1 = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPairIndex1(e.target.value)
    }

    const handleSelectPairIndex2 = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPairIndex2(e.target.value)
    }

    useEffect(() => {
        setPair1Details(supportedNetworks[pairIndex1 as number])
    }, [pairIndex1])

    useEffect(() => {
        setPair2Details(supportedNetworks[pairIndex2 as number])
    }, [pairIndex2])

    useEffect(() => {
        setHasSelected(tokenSelected(pair1Details.chainId, pair2Details.chainId) as boolean)
    }, [pair1Details.chainId, pair2Details.chainId])

    useEffect(() => {
        if (!isAddressZero(pair1?.data as Address) && !isAddressZero(pair2?.data as Address)) {
          setIsAvaliable(true)
        }
    }, [pair1?.data, pair2?.data])

    useEffect(() => {
        if (pair1.data) {
            //const priceRatio = getPriceRatio(pair2Reserve1.data as BigNumber, pair2Reserve2.data as BigNumber)
            //console.log(" ===== ", priceRatio.toString())
            //console.log((Number(convertToEther(priceRatio.mul(amount1 as number)))))
            //setAmount2(Number(convertToEther(priceRatio.mul(amount1 as number))))
        }
    }, [amount1, pair1.data, pair2Reserve1.data, pair2Reserve2.data])

    useEffect(() => {
        if (amount1) {
            setAmount2(price * amount1)
        }
    }, [amount1, pair1.data, price])

    console.log((pair2pending?.data))

    useEffect(() => {
        if ((pair2pending?.data as POSITION[])?.length > 0) {
           
            const data = (pair2pending?.data as POSITION[])?.[0]

            const amountIn1 = Number(convertToEther(data?.amountIn1))

            const amountIn2 = Number(convertToEther(data?.amountIn2))

            setAmount1(amountIn2)

            //setAmount2(amountIn1)

            setPrice(amountIn1 * amountIn2 * 100)

            if (data.paid) {
                setDisable1(false)
                setDisable2(true)
            } else {
                setDisable1(true)
                setDisable2(false)
            }
        } else {
            setDisable1(false)
            setDisable2(false)
        }

    }, [pair2pending?.data])

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
                                
                                {   hasSelected &&
                                    <div className='flex flex-col w-full py-3 px-1'>
                                        
                                        <p>You will earn 1% in fees</p>

                                        {   !isAvailable &&
                                            <p className='text-center mt-2 font-semibold'>
                                                Price: 
                                                <strong className='ml-2'> 
                                                    1 {pair1Details.symbol} =  
                                                    <b className='ml-2'></b>{price.toFixed(4)} {pair2Details.symbol} 
                                                </strong>
                                            </p>
                                        }


                                        {   pair2Reserve1.data ?
                                            <p className='flex mt-2 font-semibold'>
                                                Price: 
                                                <strong className='flex ml-2'> 
                                                    1 {pair1Details.symbol} =  
                                                    <p className='ml-2'>
                                                        {/* {getPriceRatio(pair2Reserve1.data as BigNumber, pair2Reserve2.data as BigNumber).toString()}
                                                        {pair2Details.symbol}  */}
                                                    </p>
                                                </strong>
                                            </p> : ""
                                        }


                                    </div>
                                }

                                <div className='flex-1'></div>

                                <div>
                                    {
                                        (hasSelected && !isAvailable) && 
                                            <CreatePair 
                                                contract={pair1Details.factoryAddress as Address}
                                                originChainName={pair1Details.name}
                                                originChainId={pair1Details.chainId}
                                                originDomainId={pair1Details.domainId}
                                                remoteContract={pair2Details.factoryAddress as Address}
                                                remoteChainId={pair2Details.chainId}
                                                remoteChainName={pair2Details.name}
                                                remoteDomainId={pair2Details.domainId}
                                                amount1={amount1}
                                                amount2={amount2}
                                                symbol={pair1Details.symbol}
                                                remoteSymbol={pair2Details.symbol}
                                                isSelected={hasSelected}
                                                setPrice={setPrice}
                                                />
                                    }
                                </div>

                                { hasSelected &&
                                    <>
                                        <div>
                                            {
                                                !isAddressZero(pair1?.data as Address) && !isAddressZero(pair2?.data as Address) &&
                                                    <AddLiquidity 
                                                        contract={pair1Details.factoryAddress as Address}
                                                        originChainName={pair1Details.name}
                                                        originChainId={pair1Details.chainId}
                                                        originDomainId={pair1Details.domainId}
                                                        remoteContract={pair2Details.factoryAddress as Address}
                                                        remoteChainId={pair2Details.chainId}
                                                        remoteChainName={pair2Details.name}
                                                        remoteDomainId={pair2Details.domainId}
                                                        amount1={amount1}
                                                        amount2={amount2}
                                                        symbol={pair1Details.symbol}
                                                        isSelected={hasSelected}
                                                        disabled={disable1}
                                                        />
                                            }
                                        </div>

                                        <div>
                                            {
                                                !isAddressZero(pair1?.data as Address) && !isAddressZero(pair2?.data as Address) &&
                                                    <>

                                                        <AddLiquidity 
                                                            contract={pair2Details.factoryAddress as Address}
                                                            originChainName={pair2Details.name}
                                                            originChainId={pair2Details.chainId}
                                                            originDomainId={pair2Details.domainId}
                                                            remoteContract={pair1Details.factoryAddress as Address}
                                                            remoteChainId={pair1Details.chainId}
                                                            remoteChainName={pair1Details.name}
                                                            remoteDomainId={pair1Details.domainId}
                                                            amount1={amount2}
                                                            amount2={amount1}
                                                            symbol={pair2Details.symbol}
                                                            isSelected={hasSelected}
                                                            disabled={disable2}
                                                            />

                                                    </>
                                            }
                                        </div>
                                    </>
                                }

                            </div>

                            <div className='flex flex-col gap-2'>

                                <h3 className='font-semibold mt-2'> Enter Amount </h3>
                                
                                <TokenSelector 
                                    disableInput={disable1 || disable2}
                                    selectable={false} value={amount1} 
                                    chainIndex={pairIndex1} setValue={setAmount1} />

                                <TokenSelector 
                                    disableInput={disable1 || disable2}
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
