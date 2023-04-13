import Image from 'next/image';
import { Connector, useConnect } from 'wagmi'
import { SUPPORTED_WALLETS } from '@/libs/types';

interface IProps {
    connector: Connector;
}

const Wallet = (props: IProps) => {

    const { connector } = props

    const { connect, error  } = useConnect()

    //if (error) toast(error)

    const icon = (id: SUPPORTED_WALLETS) => {
        switch(id) {
            case "walletConnect":
                return  <Image alt={connect.name} src="/icons/walletconnect-logo.png" height={40} width={40} />
            case "coinbaseWallet":
                return <Image alt={connect.name} src="/icons/coinbasewallet-logo.png" height={40} width={40} />
            default:
                return  <Image alt={connect.name} src="/icons/metamask-logo.png" height={40} width={40} />
        }
    }

    return (
        <button 
            className='flex flex-col rounded-lg w-full h-24 md:h-auto aspect-video shadow-lg items-center justify-center'
            onClick={() => connect({ connector })}>
            {icon(connector?.id as SUPPORTED_WALLETS)}
            <p> {connector.name} </p>
        </button>
    )
}


export default Wallet