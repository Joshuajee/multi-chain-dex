import { useAccount } from 'wagmi'
import truncAddress from 'truncate-eth-address'
import { AiOutlineWallet } from 'react-icons/ai'
import  { RxCaretDown } from 'react-icons/rx'
import { useState } from 'react'
import ConnectionInfo from './connectionInfo'
import WalletOptions from './walletsOptions'



const ConnectionBtn = () => {

    const { address, isConnected } = useAccount()
    const [show, setShow] = useState(false)
    const [showOptions, setShowOptions] = useState(false)

    const close  = () => {
        setShow(false)
    }

    const closeOptions  = () => {
        setShowOptions(false)
    }

    return (
        <div className='text-xs md:text-base '>

            { !isConnected &&
                <button 
                    onClick={() => setShowOptions(true)}
                    className="md:px-10 rounded-lg h-4 md:h-10 text-xs md:text-base bg-blue-800 text-white hover:bg-blue-900">
                    Connect Wallet 
                </button>

            }


            <ConnectionInfo show={show} close={close} />

            <WalletOptions close={closeOptions} />

        </div>
    )
}

export default ConnectionBtn