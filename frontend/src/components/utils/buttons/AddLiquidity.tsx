import { useState, useEffect } from 'react';
import { Address, useAccount, useContractEvent, useContractRead, useContractWrite, useNetwork, useSwitchNetwork, useWaitForTransaction } from 'wagmi'
import MDexV1NativeFactoryABI from "@/abi/contracts/MDexV1NativeFactory.sol/MDexV1NativeFactory.json";
import MDexV1PairNativeABI from "@/abi/contracts/MDexV1PairNative.sol/MDexV1PairNative.json";
import { contractAddress, convertToEther, convertToWEI } from '@/libs/utils'
import { GAS_FEES } from '@/libs/enums'
import { toast } from 'react-toastify';
import Web3btn from './Web3btn';
import { BigNumber } from 'ethers';


interface IProps {
    contract: Address;
    remoteContract: Address;
    remoteChainId: number;
    originDomainId: number;
    originChainId: number;
    remoteDomainId: number;
    originChainName: string;
    remoteChainName: string;
    amount1: number | undefined;
    amount2: number | undefined;
    symbol: string;
    isSelected: boolean;
    disabled: boolean;
}

export default function AddLiquidity(props: IProps) {

    const { 
        contract, amount1, amount2, remoteDomainId, originDomainId, 
        remoteChainId, originChainId, remoteContract, originChainName, 
        remoteChainName, symbol, isSelected, disabled 
    } = props

    const [loading, setLoading] = useState(false)

    const [loadingText, setLoadingText] = useState("Please Wait...")

    const [payment, setPayment] = useState<BigNumber>()

    const gasQuotes = useContractRead({
        address: contract as Address,
        abi: MDexV1NativeFactoryABI,
        functionName: 'quoteGasPayment',
        args: [remoteDomainId, GAS_FEES.ADD_LIQUIDITY],
        chainId: originChainId,
        enabled: isSelected
    })

    const addLiquidity = useContractWrite({
        mode: 'recklesslyUnprepared',
        address: contract,
        abi: MDexV1NativeFactoryABI,
        functionName: 'addLiquidity',
        args: [remoteDomainId, convertToWEI(amount1 as number), convertToWEI(amount2 as number), GAS_FEES.ADD_LIQUIDITY, remoteContract, { value: payment }],
        chainId: originChainId,
    })

    const { isLoading } = useWaitForTransaction({
        hash: addLiquidity.data?.hash as any,
        chainId: originChainId,
        enabled: addLiquidity.data != undefined 
    })

    useContractEvent({
        address: remoteContract,
        abi: MDexV1NativeFactoryABI,
        eventName: 'ReceivedMessage',
        listener(domain, sender, msg) {
            console.log(domain, sender, msg)
            if (domain === originDomainId && contract === sender) {
                setLoading(false)
                toast.success("Liquidity added successfully")
                console.log(msg)
            }
        },
        chainId: remoteChainId 
    })


    useEffect(() => {
        if (addLiquidity.isLoading) {
            setLoadingText("Sending Transaction...")
            setLoading(true)
        } else if (isLoading) {
            setLoadingText("Waiting For Confirmation...")
            setLoading(true)
        } else {
            setLoadingText("Waiting For Remote Confirmation...")
            //setLoading(false)
        }
    }, [addLiquidity.isLoading, isLoading])

    useEffect(() => {

        const gaspay = gasQuotes?.data

        if (gaspay) {
            setPayment((gaspay as BigNumber).add(convertToWEI(amount1 as number)))
        }

    }, [gasQuotes?.data, amount1, amount2])


    return (
        <div>

            <p className='mt-2 font-semibold'>
                Gas Fee: 
                <strong className='ml-2'> {Number(convertToEther(gasQuotes?.data as number)).toFixed(4)} {symbol} </strong>
            </p>

            <Web3btn
                disabled={disabled}
                loadingText={loadingText}
                loading={loading} 
                chain={originChainName}
                chainId={originChainId}
                onClick={() => addLiquidity?.write?.()}>Add Liquidity  {originChainName}
            </Web3btn>

        </div>
    )

}
