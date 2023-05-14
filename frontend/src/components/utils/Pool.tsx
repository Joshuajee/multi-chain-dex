import { useEffect } from 'react'
import { Address, useContractRead, useContractWrite, useNetwork, useSwitchNetwork } from 'wagmi'
import { convertToEther, convertToWEI, currencyByChainId, currencyByDomainId, networkNameByDomainId, supportedNetworks } from '@/libs/utils'
import MDexV1NativeFactoryABI from "@/abi/contracts/MDexV1NativeFactory.sol/MDexV1NativeFactory.json";
import { POSITION } from '@/libs/interfaces'
import LoadingButton from '@/components/utils/LoadingButton'
import MDexV1PairNativeABI from "@/abi/contracts/MDexV1PairNative.sol/MDexV1PairNative.json";
import { toast } from 'react-toastify';
import { DOMAIN_ID } from '@/libs/enums';

interface IProps {
    position: POSITION,
    factory: Address,
    currency: string
}

export default function Pool(props: IProps) {

    const { chain } = useNetwork()
    const { switchNetwork } = useSwitchNetwork()

    const { position, currency, factory } = props

    const pair = useContractRead({
        address: factory as Address,
        abi: MDexV1NativeFactoryABI,
        functionName: 'getPair',
        args: [chain?.id, position.remoteDomain],
    })

    const collect = useContractWrite({
        mode: 'recklesslyUnprepared',
        address: pair.data as Address,
        abi: MDexV1PairNativeABI,
        functionName: 'collectFee',
        args: [position.tokenId],
        chainId: chain?.id,
    })

    useEffect(() => {
        if (collect.isError) {
            toast.error(collect.error?.message)
        }
    }, [collect.isError, collect.error])

    useEffect(() => {
        if (collect.isSuccess) {
            toast.success("Fees Collected Successfully")
        }
    }, [collect.isSuccess])

    return (
        <div className='font-medium border-cyan-700 border-[1px] p-2 rounded-md'> 

            <h3 className='font-bold'> {currencyByChainId(chain?.id as DOMAIN_ID)} / {currencyByDomainId(position.remoteDomain)} </h3>

            <div className='flex justify-between'>
                <p>Investment 1: {Number(convertToEther(position.amountIn1)).toFixed(6)} {currency}</p>
                <p>Investment 2: {Number(convertToEther(position.amountIn2)).toFixed(6)} {currencyByDomainId(position.remoteDomain)}</p>
            </div>

            <div className='flex justify-between'>
                <p>Available Fees: {Number(convertToEther(position.availableFees)).toFixed(6)} {currency} </p>
                <p>Total Fees: {Number(convertToEther(position.totalFees)).toFixed(6)} {currency} </p>
            </div>

            <div className='flex space-x-5 justify-between'>

                <LoadingButton loading={collect.isLoading} onClick={collect.write} color='green'>Collect Fees</LoadingButton>

                <LoadingButton onClick={() => switchNetwork?.(position.remoteDomain)} color='yellow'>Switch To {networkNameByDomainId(position.remoteDomain)}</LoadingButton>
            
            </div>

        </div>
    )
}
