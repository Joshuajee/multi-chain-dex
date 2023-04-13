import {  useConnect, useAccount } from 'wagmi'
import Wallet from './wallet'

interface IProps {
    close: () => void
}


const WalletOptions = (props: IProps) => {

    const {close} = props

    const { isConnected } = useAccount()

    const { connectors, error, isLoading, pendingConnector } = useConnect()

    if (isConnected) close()

    return (
        <div>

            <div className='p-4'>
        
                <div className='grid grid-cols-2 my-2 gap-4'> 

                    {
                        connectors.map((connector, index: number) => {
                            return <Wallet key={index} connector={connector} />
                        })
                    }
                    
                </div> 

            </div>

        </div>
    )
}

export default WalletOptions