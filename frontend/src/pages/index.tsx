import TokenSelector from '@/components/wigets/TokenSelector'
import Container from '@/components/utils/Container'
import Layout from '@/components/utils/Layout'
import { useCallback, useEffect, useState } from 'react'
import { Address, useContractRead, } from 'wagmi'
import MDexV1NativeFactoryABI from "@/abi/contracts/MDexV1NativeFactory.sol/MDexV1NativeFactory.json";
import MDexV1PairNativeABI from "@/abi/contracts/MDexV1PairNative.sol/MDexV1PairNative.json";
import { convertToEther, convertToWEI, getPrice, isAddressZero, supportedNetworks, tokenSelected } from '@/libs/utils'
import { GAS_FEES } from '@/libs/enums'
import { SUPPORTED_NETWORKS } from '@/libs/interfaces'
import { BigNumber } from 'ethers'
import SwapBtn from '@/components/utils/buttons/SwapBtn'


export default function Home() {

  const [valueFrom, setValueFrom] = useState<number | undefined>()
  const [valueTo, setValueTo] = useState<number | undefined>()

  const [isAvailable, setIsAvaliable] = useState(false);

  const [chainIdFrom, setChainIdFrom] = useState<number | string>(0)
  const [chainIdTo, setChainIdTo] = useState<number| string>(0)

  const [pair1Details, setPair1Details] = useState<SUPPORTED_NETWORKS>(supportedNetworks[chainIdFrom as number])
  const [pair2Details, setPair2Details] = useState<SUPPORTED_NETWORKS>(supportedNetworks[chainIdTo as number])

  const [payment, setPayment] = useState<any>()

  const [price, setPrice] = useState<any>()

  const [priceRatio, setPriceRatio] = useState<any>()

  const [error, setError] = useState(false)

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

  const gasQuotes = useContractRead({
    address: pair1Details.factoryAddress as Address,
    abi: MDexV1NativeFactoryABI,
    functionName: 'quoteGasPayment',
    args: [pair2Details.domainId, GAS_FEES.SWAP_TOKEN],
    chainId: pair1Details.chainId,
    enabled: tokenSelected(pair1Details.chainId, pair2Details.chainId)
  })


  const updatePrice = useCallback(() => {

    if (pair2Reserve1?.data && pair2Reserve1?.data) {
        
        const amountIn1 = pair2Reserve1.data as BigNumber
        const amountIn2 = pair2Reserve2.data as BigNumber

        if (!amountIn1?.eq(0) || !amountIn2?.eq(0)) {

            if (amountIn1?.gt(amountIn2)) {
                setPriceRatio(Number(amountIn1?.div(amountIn2)?.toString()))
            } else {
                setPriceRatio(1 / Number(amountIn2?.div(amountIn1)?.toString()))
            }

        //    setValidPrice(true)

        } else {
        //    setValidPrice(false)
        }

    }

}, [pair2Reserve1?.data, pair2Reserve2?.data])


  useEffect(() => {
    setPair1Details(supportedNetworks[chainIdFrom as number])
  }, [chainIdFrom])

  useEffect(() => {
    setPair2Details(supportedNetworks[chainIdTo as number])
  }, [chainIdTo])

  useEffect(() => {
    if (!isAddressZero(pair1?.data as Address) && !isAddressZero(pair2?.data as Address)) {
      setIsAvaliable(true)
    }
  }, [pair1?.data, pair2?.data])

  useEffect(() => {
    if ((pair2Reserve1.data as BigNumber)?.gt(0) && (pair2Reserve2.data as BigNumber)?.gt(0)) {
      setPrice(getPrice(valueFrom as number, (pair2Reserve1.data as BigNumber), pair2Reserve2.data as BigNumber))
      setError(false)
    } else {
      setError(true)
    }
  }, [valueFrom, pair2Reserve1.data, pair2Reserve2.data, pair1Details.chainId, pair2Details.chainId])

  useEffect(() => {
    setValueTo(Number(price) * Number(1))
  }, [valueFrom, price])

  useEffect(() => {
    const gaspay = gasQuotes?.data 
    if (gaspay) {
      const value = (gaspay as BigNumber).add(convertToWEI(valueFrom as number) as BigNumber)
      setPayment(value)
    }

  }, [gasQuotes?.data, valueFrom])

  useEffect(() => {
    updatePrice()
  }, [updatePrice])

  console.log(priceRatio)

  return (
    <Layout>

      <Container>

        <div className='flex flex-col justify-center items-center w-full'>
          { tokenSelected(pair1Details.chainId, pair2Details.chainId) &&
            <>
              { !error?
                <div className="flex p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400" role="alert">
                  <svg aria-hidden="true" className="flex-shrink-0 inline w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
                  <span className="sr-only">Info</span>
                  <div>
                    Interchain Gas : 
                      <strong className='ml-[1px]'> 
                      {convertToEther(gasQuotes?.data as number)} {pair1Details.symbol}
                      </strong>
                  </div>
                </div>
                : 
                <div className="flex p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800" role="alert">
                  <svg aria-hidden="true" className="flex-shrink-0 inline w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
                  <span className="sr-only">Warning</span>
                  <div>
                    This Pair Doesn&apos;t have enough Liquidity
                  </div>
                </div>
              }
            </>
          }

          <div 
            className={`
              text-gray-700 bg-white rounded-md p-4 md:px-4 shadow-lg w-full max-w-[450px] overflow-x-hidden
            `}>

            <h1>Swap</h1>

            <TokenSelector selectable={true} value={valueFrom} chainIndex={chainIdFrom} setValue={setValueFrom} setChainIndex={setChainIdFrom}  />

            <TokenSelector selectable={true} value={valueTo} chainIndex={chainIdTo} setValue={setValueTo} setChainIndex={setChainIdTo} />

            <SwapBtn 
              chainId={pair1Details.chainId}
              domainId={pair2Details.domainId}
              destinationChainId={pair2Details.chainId}
              contract={pair1Details.factoryAddress as Address}
              destinationContract={pair2Details.factoryAddress as Address}
              originDomainId={pair1Details.domainId}
              payment={payment}
              amountIn={valueFrom}
              chainName={pair1Details.name}
              tokenSelected={tokenSelected(pair1Details.chainId, pair2Details.chainId)}
              disabled={error}
              />

          </div>

        </div>

      </Container>

    </Layout>
  )
}
