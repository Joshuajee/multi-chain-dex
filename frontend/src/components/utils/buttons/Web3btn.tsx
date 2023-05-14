import { ReactNode, useEffect, useState } from "react";
import LoadingButton from "../LoadingButton"
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi";
import ModalWrapper from "../ModalWrapper";
import WalletOptions from "../../connection/walletsOptions";

interface IProps { 
    color?: string; 
    disabled?: boolean; 
    loading?: boolean;
    onClick?: () => void; 
    children: ReactNode ,
    chain: string,
    chainId?: number,
    loadingText?: string;
}

const Web3btn = (props: IProps) => {

    const { isConnected } = useAccount()
    const { chain } = useNetwork()
    const { switchNetwork } = useSwitchNetwork()
    const [showOptions, setShowOptions] = useState(false)
    const [switchChain, setSwitchChain] = useState(false)

    const closeOptions  = () => {
        setShowOptions(false)
    }
    

    const click = () => {

        if (!isConnected) return setShowOptions(true)

        if (switchChain)  return switchNetwork?.(props.chainId)

        props?.onClick?.()

    }

    useEffect(() => {
        if (props.chainId && props.chainId !== chain?.id)   {
            setSwitchChain(true)
        } else {
            setSwitchChain(false)
        }
    }, [props.chainId, chain?.id])


    return (
        <div>
            <LoadingButton loadingText={props.loadingText} color={props.color} loading={props.loading} disabled={props.disabled} onClick={click}>
                {
                    !isConnected ? "Connect Wallet" : switchChain ? `Switch to ${props.chain}` :  props.children 
                }
            </LoadingButton>

            <ModalWrapper title={"Choose Wallet"} open={showOptions} handleClose={closeOptions}>
                <WalletOptions close={closeOptions}/>
            </ModalWrapper>
            
        </div>
    )

}

export default Web3btn