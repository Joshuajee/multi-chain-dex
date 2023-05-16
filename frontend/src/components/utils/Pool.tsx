import { useEffect, useState } from 'react'
import { Address, useContractRead, useContractWrite, useNetwork, useSwitchNetwork } from 'wagmi'
import { convertToEther, convertToWEI, currencyByChainId, currencyByDomainId, networkNameByDomainId, supportedNetworks } from '@/libs/utils'
import MDexV1NativeFactoryABI from "@/abi/contracts/MDexV1NativeFactory.sol/MDexV1NativeFactory.json";
import { POSITION } from '@/libs/interfaces'
import LoadingButton from '@/components/utils/LoadingButton'
import MDexV1PairNativeABI from "@/abi/contracts/MDexV1PairNative.sol/MDexV1PairNative.json";
import { toast } from 'react-toastify';
import { DOMAIN_ID } from '@/libs/enums';
import ModalWrapper from './ModalWrapper';

interface IProps {
    position: POSITION,
    factory: Address,
    currency: string
}

export default function Pool(props: IProps) {

    const { chain } = useNetwork()
    const { switchNetwork } = useSwitchNetwork()

    const [show, setShow] = useState(false)

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

    const handleClose = () => {
        setShow(false)
    }

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

            <div className='flex space-x-5 justify-center'>

                <LoadingButton 
                    onClick={() => setShow(true)} 
                    color='red'>
                    Remove Position
                </LoadingButton>

            </div>

            <ModalWrapper open={show} title='Remove Position' handleClose={handleClose}>
                <div className="flex flex-col justify-center gap-2 mt-4">


                    <h3 className='text-center font-semibold'>Gas Fee: </h3>

                    <h3 className='text-center'>Are You sure you want to remove this position?</h3>

                    <h5 className='text-center'>Your Investments will be refunded and your fees will be returned</h5>

                    <h3 className='font-bold'> {currencyByChainId(chain?.id as DOMAIN_ID)} / {currencyByDomainId(position.remoteDomain)} </h3>

                    <div className='flex flex-col'>
                        <div className='flex justify-between'>
                            <p>Investment 1: {Number(convertToEther(position.amountIn1)).toFixed(6)} {currency}</p>
                            <p>Investment 2: {Number(convertToEther(position.amountIn2)).toFixed(6)} {currencyByDomainId(position.remoteDomain)}</p>
                        </div>

                        <div className='flex justify-between'>
                            <p>Available Fees: {Number(convertToEther(position.availableFees)).toFixed(6)} {currency} </p>
                            <p>Total Fees: {Number(convertToEther(position.totalFees)).toFixed(6)} {currency} </p>
                        </div>
                    </div>

                    <div className='flex justify-center gap-4 mt-2'>

                        <button className="bg-red-500 hover:bg-red-600 text-white w-20 p-2 rounded-lg">
                            Yes
                        </button>

                        <button onClick={handleClose} className="bg-gray-500 hover:bg-gray-600 text-white w-20 p-2 rounded-lg">
                            No
                        </button>

                    </div>

                </div>
            </ModalWrapper>

        </div>
    )
}
