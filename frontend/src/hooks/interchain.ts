import { useState, useEffect, ChangeEvent } from 'react';
import { Address, useContractEvent, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi'
import MDexV1NativeFactoryABI from "@/abi/contracts/MDexV1NativeFactory.sol/MDexV1NativeFactory.json";
import { convertToWEI } from '@/libs/utils'
import { GAS_FEES } from '@/libs/enums'
import { toast } from 'react-toastify';
import { BigNumber } from 'ethers';

export interface IInterchainProperties {
    contract: Address;
    remoteContract: Address;
    remoteChainId: number;
    originDomainId: number;
    originChainId: number;
    remoteDomainId: number;
    position: BigNumber;
}

export const useInterChain = (properties:  IInterchainProperties) => {

    const { 
        contract, remoteDomainId, originDomainId, 
        remoteChainId, originChainId, remoteContract, position
    } = properties

    const [loading, setLoading] = useState(false)

    const [loadingText, setLoadingText] = useState("Please Wait...")

    const [payment, setPayment] = useState<BigNumber>()

    const [success, setSuccess] = useState(false)

    const gasQuotes = useContractRead({
        address: contract as Address,
        abi: MDexV1NativeFactoryABI,
        functionName: 'quoteGasPayment',
        args: [remoteDomainId, GAS_FEES.REMOVE_LIQUIDITY],
        chainId: originChainId,
    })

    const removeLiquidity = useContractWrite({
        mode: 'recklesslyUnprepared',
        address: contract,
        abi: MDexV1NativeFactoryABI,
        functionName: 'removeLiquidity',
        args: [remoteDomainId, position, GAS_FEES.REMOVE_LIQUIDITY, remoteContract, { value: payment}],
        chainId: originChainId,
    })

    const { isLoading } = useWaitForTransaction({
        hash: removeLiquidity.data?.hash as any,
        chainId: originChainId,
        enabled: removeLiquidity.data != undefined 
    })

    const onClick = () => {
        removeLiquidity.write()
    }

    useContractEvent({
        address: remoteContract,
        abi: MDexV1NativeFactoryABI,
        eventName: 'ReceivedMessage',
        listener(domain, sender, msg) {
            if (domain === originDomainId && contract === sender) {
                setLoading(false)
                setSuccess(true)
                console.log(msg)
            }
        },
        chainId: remoteChainId 
    })

    useEffect(() => {
        if (removeLiquidity.isLoading) {
            setLoadingText("Sending Transaction...")
            setLoading(true)
        } else if (isLoading) {
            setLoadingText("Waiting For Confirmation...")
            setLoading(true)
        } else {
            setLoadingText("Waiting For Remote Confirmation...")
            //setLoading(false)
        }
    }, [removeLiquidity.isLoading, isLoading])

    useEffect(() => {
        const gaspay = gasQuotes?.data
        if (gaspay) {
            setPayment((gaspay as BigNumber))
        }
    }, [gasQuotes?.data])

    useEffect(() => {
        if (removeLiquidity.isError) {
            toast.error(removeLiquidity.error?.message)
            setLoading(false)
        }
    }, [removeLiquidity.isError, removeLiquidity.error])



    return { loading, loadingText, payment, success, onClick }

}

