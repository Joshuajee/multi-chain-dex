import { useState, useEffect, ChangeEvent } from 'react';
import { Address, useContractEvent, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi'
import MDexV1NativeFactoryABI from "@/abi/contracts/MDexV1NativeFactory.sol/MDexV1NativeFactory.json";
import { convertToEther, convertToWEI } from '@/libs/utils'
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
    remoteSymbol: string;
    isSelected: boolean;
    setPrice(val: number): void;
}

export default function CreatePair(props: IProps) {

    const { 
        contract, amount1, amount2, remoteDomainId, originDomainId, 
        remoteChainId, originChainId, remoteContract, originChainName, 
        symbol, isSelected, remoteSymbol, setPrice 
    } = props

    const [loading, setLoading] = useState(false)

    const [loadingText, setLoadingText] = useState("Please Wait...")

    const [value, setValue] = useState<string | number>(1)

    

    console.log(contract)

    const [payment, setPayment] = useState<BigNumber>()

    const gasQuotes = useContractRead({
        address: contract as Address,
        abi: MDexV1NativeFactoryABI,
        functionName: 'quoteGasPayment',
        args: [remoteDomainId, GAS_FEES.CREATE],
        chainId: originChainId,
        enabled: isSelected
    })

    console.log(contract, originChainId)

    const createPair = useContractWrite({
        mode: 'recklesslyUnprepared',
        address: contract,
        abi: MDexV1NativeFactoryABI,
        functionName: 'createPair',
        args: [remoteDomainId, convertToWEI(amount1 as number), convertToWEI(amount2 as number), GAS_FEES.ADD_LIQUIDITY, remoteContract, { value: payment }],
        chainId: originChainId,
    })

    const { isLoading } = useWaitForTransaction({
        hash: createPair.data?.hash as any,
        chainId: originChainId,
        enabled: createPair.data != undefined 
    })

    useContractEvent({
        address: remoteContract,
        abi: MDexV1NativeFactoryABI,
        eventName: 'ReceivedMessage',
        listener(domain, sender, msg) {
            if (domain === originDomainId && contract === sender) {
                setLoading(false)
                toast.success("Pair Created & Liquidity added successfully")
                console.log(msg)
            }
        },
        chainId: remoteChainId 
    })


    useEffect(() => {
        if (createPair.isLoading) {
            setLoadingText("Sending Transaction...")
            setLoading(true)
        } else if (isLoading) {
            setLoadingText("Waiting For Confirmation...")
            setLoading(true)
        } else {
            setLoadingText("Waiting For Remote Confirmation...")
            //setLoading(false)
        }
    }, [createPair.isLoading, isLoading])


    useEffect(() => {
        const gaspay = gasQuotes?.data
        if (gaspay) {
            setPayment((gaspay as BigNumber).add(convertToWEI(amount1 as number)))
        }
    }, [gasQuotes?.data, amount1, amount2])


    useEffect(() => {
        setPrice(Number(value))
    }, [value, setPrice])


    return (
        <div>

            <div className='flex justify-center'>
                1 Matic = 
                <input 
                    type='number'
                    className='ml-2 h-6 w-20 outline-none bg-gray-200  rounded-lg px-2'
                    value={value}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
                    />
                
                {remoteSymbol}
                
            </div>

            <p className='text-center mt-2 font-semibold'>
                Gas Fee: 
                <strong className='ml-2'> {Number(convertToEther(gasQuotes?.data as number)).toFixed(4)} {symbol} </strong>
            </p>

            <Web3btn
                loadingText={loadingText}
                loading={loading} 
                chain={originChainName}
                chainId={originChainId}
                onClick={() => createPair?.write?.()}> Create Pair
            </Web3btn>

        </div>
    )

}
