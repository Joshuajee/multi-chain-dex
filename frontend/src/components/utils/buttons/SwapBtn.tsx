import { useEffect, useState } from 'react'
import { Address, useAccount, useBalance, useContractEvent, useContractWrite, useNetwork, useSwitchNetwork, useWaitForTransaction } from 'wagmi'
import MDexV1NativeFactoryABI from "@/abi/contracts/MDexV1NativeFactory.sol/MDexV1NativeFactory.json";
import { MIN_AMOUNT, convertToWEI, currencyByChainId, isAddressZero } from '@/libs/utils'
import { GAS_FEES } from '@/libs/enums'
import ModalWrapper from '../ModalWrapper'
import WalletOptions from '../../connection/walletsOptions'
import { toast } from 'react-toastify';
import SwapSuccessModal from '../SwapSuccessModal';


interface IProps {
    contract: Address;
    remoteContract: Address;
    remoteChainId: number;
    originDomainId: number;
    amountIn: number | undefined;
    chainId: number;
    domainId: number;
    payment: number;
    payout: number;
    chainName: string;
    tokenSelected: boolean;
    disabled: boolean;
    close(): void;
}

export default function SwapBtn(props: IProps) {

    const { 
        contract, amountIn, chainId, domainId, originDomainId, 
        remoteChainId, remoteContract, chainName, payment, 
        tokenSelected, disabled, payout, close
    } = props

    const { address } = useAccount()
    const { isConnected } = useAccount()
    const { chain } = useNetwork()
    const { switchNetwork } = useSwitchNetwork()
    const [showOptions, setShowOptions] = useState(false)
    const [switchChain, setSwitchChain] = useState(false)

    const [initailAmount, setInitialAmount] = useState(0)

    const [loading, setLoading] = useState(false)

    const [success, setSuccess] = useState(false)

    const [loadingText, setLoadingText] = useState("Please Wait...")

    const [text, setText] = useState("SWAP")

    const closeOptions  = () => {
        setShowOptions(false)
    }

    const balance = useBalance({
        address: address,
        chainId: remoteChainId,
        enabled: remoteChainId != 0,
        watch: true
    })

    const swap = useContractWrite({
        mode: 'recklesslyUnprepared',
        address: contract,
        abi: MDexV1NativeFactoryABI,
        functionName: 'swap',
        args: [domainId, convertToWEI(amountIn as number), GAS_FEES.SWAP_TOKEN, address, remoteContract, { value: payment }],
        chainId: chainId,
    })

    const { isLoading } = useWaitForTransaction({
        hash: swap.data?.hash as any,
        chainId: chainId,
        enabled: swap.data != undefined 
    })

    useContractEvent({
        address: remoteContract,
        abi: MDexV1NativeFactoryABI,
        eventName: 'ReceivedMessage',
        listener(domain, sender, msg) {
            if (domain === originDomainId && contract === sender) {
                setSuccess(true)
                setLoading(false)
                toast.success("Swap is successful")
                console.log(msg)
            }
        },
        chainId: remoteChainId 
    })

    const click = () => {
        if (!isConnected) return setShowOptions(true)

        if (switchChain)  return switchNetwork?.(props.chainId)

        if (Number(amountIn) <= MIN_AMOUNT)  return 

        setInitialAmount(Number(balance.data?.formatted))

        swap?.write?.()
    }

    useEffect(() => {
        if (chainId && chainId !== chain?.id)   {
            setSwitchChain(true)
        } else {
            setSwitchChain(false)
        }
    }, [chainId, chain?.id])
    
    useEffect(() => {
        if (!tokenSelected) setText("Please Select Networks")
        else if (!isConnected) setText("Connect Wallet")
        else if (switchChain) setText( `Switch to ${chainName}`)
        else if (Number(amountIn) <= MIN_AMOUNT) setText(`Amount Must be creater than ${MIN_AMOUNT}`)
        else setText("SWAP")
    }, [isConnected, switchChain, chainName, amountIn, tokenSelected])

    useEffect(() => {
        if (swap.isLoading) {
            setLoadingText("Sending Transaction...")
            setLoading(true)
        } else if (isLoading) {
            setLoadingText("Waiting For Confirmation...")
            setLoading(true)
        } else {
            setLoadingText("Waiting For Remote Confirmation...")
            //setLoading(false)
        }
    }, [swap.isLoading, isLoading])

    useEffect(() => {
        if (swap.isError) {
            toast.error(swap.error?.message)
            setLoading(false)
        }
    }, [swap.isError, swap.error, disabled])

    const handleClose = () => {
        close()
        setSuccess(false)
        setShowOptions(false)
        setSwitchChain(false)
        setInitialAmount(0)
        setLoading(false)
        setSuccess(false)
        setLoadingText("Please Wait...")
        setText("SWAP")
    }
    
    if (loading)
        return (
            <button 
                disabled={disabled}
                className={`bg-gray-500  rounded-2xl px-2 h-16 mt-2 w-full`}>
                { loadingText }
            </button>
        )

    return (
        <>
            <button 
                disabled={disabled}
                onClick={click} 
                className={`disabled:bg-gray-500 bg-green-600 hover:bg-green-700 text-white rounded-2xl px-2 h-16 mt-2 w-full`}>
                { text }
            </button>

            <ModalWrapper title={"Choose Wallet"} open={showOptions} handleClose={closeOptions}>
                <WalletOptions close={closeOptions}/>
            </ModalWrapper>

            <SwapSuccessModal 
                open={success}  
                handleClose={handleClose}
                currency={currencyByChainId(remoteChainId)}
                payout={payout}
                initialAmount={initailAmount}
                />
       
        </>
    )
}
