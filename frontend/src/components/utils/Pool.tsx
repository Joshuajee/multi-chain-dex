import { useEffect, useState } from 'react'
import { Address, useAccount, useContractRead, useContractWrite, useNetwork } from 'wagmi'
import { convertToEther, convertToWEI, currencyByChainId, isAddressZero, supportedNetworks } from '@/libs/utils'
import MDexV1NativeFactoryABI from "@/abi/contracts/MDexV1NativeFactory.sol/MDexV1NativeFactory.json";
import { POSITION } from '@/libs/interfaces'
import LoadingButton from '@/components/utils/LoadingButton'
import MDexV1PairNativeABI from "@/abi/contracts/MDexV1PairNative.sol/MDexV1PairNative.json";

interface IProps {
    position: POSITION,
    factory: Address,
    currency: string
}

export default function Pool(props: IProps) {

    const { position, currency, factory } = props

    const pair = useContractRead({
        address: factory as Address,
        abi: MDexV1NativeFactoryABI,
        functionName: 'getPair',
        args: [80001, 97],
    })

    const collect = useContractWrite({
        mode: 'recklesslyUnprepared',
        address: pair.data as Address,
        abi: MDexV1PairNativeABI,
        functionName: 'collectFee',
        args: [2],
        chainId: 80001,
    })


    console.log(position)

    console.log(pair)
    return (
        <div className='font-medium border-cyan-700 border-[1px] p-2 rounded-md'> 

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

                <LoadingButton loading={collect.isLoading} onClick={collect.write} color='green'>Collect Fees</LoadingButton>

                <LoadingButton color='yellow'>Switch To</LoadingButton>
            
            </div>

        </div>
    )
}
