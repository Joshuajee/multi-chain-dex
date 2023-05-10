import TokenSelector from '@/components/wigets/TokenSelector'
import Container from '@/components/utils/Container'
import Layout from '@/components/utils/Layout'
import { useEffect, useState } from 'react'
import { Address, useAccount, useContractRead, useContractWrite } from 'wagmi'
import MDexV1NativeFactoryABI from "@/abi/contracts/MDexV1NativeFactory.sol/MDexV1NativeFactory.json";
import MDexV1PairNativeABI from "@/abi/contracts/MDexV1PairNative.sol/MDexV1PairNative.json";
import { convertToEther, convertToWEI, getPrice, isAddressZero, supportedNetworks, tokenSelected } from '@/libs/utils'
import { GAS_FEES } from '@/libs/enums'
import { SUPPORTED_NETWORKS } from '@/libs/interfaces'
import { BigNumber } from 'ethers'
import SwapBtn from '@/components/utils/buttons/SwapBtn'


export default function Home() {

  const { address, isConnected } = useAccount()

  const [valueFrom, setValueFrom] = useState<number | undefined>()
  const [valueTo, setValueTo] = useState<number | undefined>()

  const [isAvailable, setIsAvaliable] = useState(false);

  const [chainIdFrom, setChainIdFrom] = useState<number | string>(0)
  const [chainIdTo, setChainIdTo] = useState<number| string>(0)

  const [pair1Details, setPair1Details] = useState<SUPPORTED_NETWORKS>(supportedNetworks[chainIdFrom as number])
  const [pair2Details, setPair2Details] = useState<SUPPORTED_NETWORKS>(supportedNetworks[chainIdTo as number])

  const [payment, setPayment] = useState<any>()

  const [price, setPrice] = useState<any>()

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

  const pendingPosition = useContractRead({
    address: pair1.data as Address,
    abi: MDexV1PairNativeABI,
    functionName: 'myPendingPositions',
    args: [address],
    chainId: pair1Details.chainId,
    enabled: isAvailable && isConnected
  })

  const gasQuotes = useContractRead({
    address: pair1Details.factoryAddress as Address,
    abi: MDexV1NativeFactoryABI,
    functionName: 'quoteGasPayment',
    args: [pair2Details.domainId, GAS_FEES.SWAP_TOKEN],
    chainId: pair1Details.chainId,
    enabled: tokenSelected(pair1Details.chainId, pair2Details.chainId)
  })

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
    if (pair2Reserve1.data && pair2Reserve2.data) {
      getPrice(valueFrom as number, (pair2Reserve1.data as BigNumber), pair2Reserve2.data as BigNumber)
      setPrice(getPrice(valueFrom as number, (pair2Reserve1.data as BigNumber), pair2Reserve2.data as BigNumber))
    }
  }, [valueFrom, pair2Reserve1.data, pair2Reserve2.data])

  useEffect(() => {
    setValueTo(Number(price))
  }, [valueFrom, price])

  useEffect(() => {
    const gaspay = gasQuotes?.data 
    if (gaspay) {
      const value = (gaspay as BigNumber).add(convertToWEI(valueFrom as number) as BigNumber)
      setPayment(value)
    }
  }, [gasQuotes?.data, valueFrom])


  return (
    <Layout>

      <Container>

        <div className='flex flex-col justify-center items-center w-full'>

          { gasQuotes?.data ?
            <div>Interchain Gas: {convertToEther(gasQuotes?.data as number)} {pair1Details.symbol}</div>
            : ""
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
              />

          </div>

        </div>

      </Container>

    </Layout>
  )
}
