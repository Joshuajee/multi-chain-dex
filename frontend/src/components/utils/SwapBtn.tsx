import { useEffect, useState } from 'react'
import { Address, useAccount, useContractWrite, useNetwork, useSwitchNetwork } from 'wagmi'
import MDexV1NativeFactoryABI from "@/abi/contracts/MDexV1NativeFactory.sol/MDexV1NativeFactory.json";
import { convertToWEI } from '@/libs/utils'
import { GAS_FEES } from '@/libs/enums'
import ModalWrapper from './ModalWrapper'
import WalletOptions from '../connection/walletsOptions'


interface IProps {
    contract: Address;
    destinationContract: Address;
    amountIn: number | undefined;
    chainId: number;
    domainId: number;
    payment: number;
    chainName: string;
    tokenSelected: boolean;
}

export default function SwapBtn(props: IProps) {

    const { contract, amountIn, chainId, domainId, chainName, destinationContract, payment, tokenSelected } = props

    const { address } = useAccount()
    const { isConnected } = useAccount()
    const { chain } = useNetwork()
    const { switchNetwork } = useSwitchNetwork()
    const [showOptions, setShowOptions] = useState(false)
    const [switchChain, setSwitchChain] = useState(false)

    const [text, setText] = useState("SWAP")

    const closeOptions  = () => {
        setShowOptions(false)
    }

    const swap = useContractWrite({
        mode: 'recklesslyUnprepared',
        address: contract,
        abi: MDexV1NativeFactoryABI,
        functionName: 'swap',
        args: [domainId, convertToWEI(amountIn as number), GAS_FEES.SWAP_TOKEN, address, destinationContract, { value: payment }],
        chainId: chainId,
    })

    const click = () => {
        if (!isConnected) return setShowOptions(true)

        if (switchChain)  return switchNetwork?.(props.chainId)

        if (Number(amountIn) <= 0)  return 

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
        else if (Number(amountIn) <= 0) setText("Amount Must be creater than 0.0001")
        else setText("SWAP")
    }, [isConnected, switchChain, chainName, amountIn, tokenSelected])

    return (
        <>
            <button 
                onClick={click} 
                className={`${false ?  'bg-gray-200' : 'bg-green-600 hover:bg-green-700 text-white' } rounded-2xl px-2 h-10 md:h-16 mt-2 w-full`}>
                { text }
            </button>
            <ModalWrapper title={"Choose Wallet"} open={showOptions} handleClose={closeOptions}>
                <WalletOptions close={closeOptions}/>
            </ModalWrapper>
        </>
    )
}
